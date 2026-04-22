from datetime import date

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Item, Claim


# Throttle classes use the cache backend, so we both wipe the cache between
# tests and disable the throttle classes to keep test runs deterministic.
TEST_REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (),
    'DEFAULT_THROTTLE_RATES': {},
}


@override_settings(REST_FRAMEWORK=TEST_REST_FRAMEWORK)
class _BaseAPITestCase(APITestCase):
    def setUp(self):
        cache.clear()


def _items_results(response):
    """Pull the result list out of a paginated items-list response."""
    return response.data['results']


class CategoryTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        Category.objects.get_or_create(name='Electronics', defaults={'description': 'Electronic devices'})
        Category.objects.get_or_create(name='Books', defaults={'description': 'Textbooks and notebooks'})

    def test_list_categories(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_list_categories_unauthenticated(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RegisterTests(_BaseAPITestCase):
    valid_payload = {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'Strongpass1!',
        'password_confirm': 'Strongpass1!',
    }

    def test_register_success_returns_tokens(self):
        response = self.client.post('/api/auth/register/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_duplicate_username(self):
        User.objects.create_user(username='newuser', password='Strongpass1!')
        response = self.client.post('/api/auth/register/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_duplicate_email(self):
        User.objects.create_user(username='other', email='newuser@example.com', password='Strongpass1!')
        response = self.client.post('/api/auth/register/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_password_mismatch(self):
        payload = dict(self.valid_payload, password_confirm='different')
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', response.data)


class LoginLogoutTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username='loginuser', password='Strongpass1!')

    def test_login_success_returns_tokens(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'loginuser', 'password': 'Strongpass1!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_missing_fields(self):
        response = self.client.post('/api/auth/login/', {'username': 'loginuser'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_wrong_password(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'loginuser', 'password': 'wrong'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_refresh_token(self):
        login = self.client.post(
            '/api/auth/login/',
            {'username': 'loginuser', 'password': 'Strongpass1!'},
            format='json',
        )
        refresh = login.data['refresh']

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/logout/', {'refresh': refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # The refresh token should now be unusable.
        refresh_response = self.client.post(
            '/api/auth/refresh/', {'refresh': refresh}, format='json'
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_refresh(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/logout/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_requires_auth(self):
        response = self.client.post('/api/auth/logout/', {'refresh': 'irrelevant'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeEndpointTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            username='meuser', email='me@example.com', password='Strongpass1!'
        )

    def test_me_requires_auth(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'meuser')
        self.assertEqual(response.data['email'], 'me@example.com')


class RefreshTokenTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        User.objects.create_user(username='refreshuser', password='Strongpass1!')

    def test_refresh_returns_new_access_token(self):
        login = self.client.post(
            '/api/auth/login/',
            {'username': 'refreshuser', 'password': 'Strongpass1!'},
            format='json',
        )
        refresh = login.data['refresh']
        response = self.client.post('/api/auth/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class ItemCreateTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username='owner', password='Testpass1!')
        self.category, _ = Category.objects.get_or_create(name='Electronics')
        self.valid_payload = {
            'title': 'Lost iPhone',
            'description': 'Black iPhone 15 lost near library',
            'item_type': 'lost',
            'location': 'Main Library',
            'date_lost_or_found': '2026-04-10',
            'category': self.category.pk,
        }

    def test_create_item_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/items/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Lost iPhone')
        self.assertEqual(response.data['owner'], self.user.pk)
        self.assertEqual(response.data['status'], 'active')

    def test_create_item_unauthenticated(self):
        response = self.client.post('/api/items/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_item_missing_fields(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/items/', {'title': 'Incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_ignores_status_input(self):
        self.client.force_authenticate(user=self.user)
        payload = dict(self.valid_payload, status='resolved')
        response = self.client.post('/api/items/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'active')


class ItemListTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username='owner', password='Testpass1!')
        self.cat1, _ = Category.objects.get_or_create(name='Electronics')
        self.cat2, _ = Category.objects.get_or_create(name='Books')
        self.lost_item = Item.objects.create(
            title='Lost iPhone',
            description='Black iPhone',
            item_type='lost',
            status='active',
            location='Library',
            date_lost_or_found=date(2026, 4, 10),
            owner=self.user,
            category=self.cat1,
        )
        self.found_item = Item.objects.create(
            title='Found Textbook',
            description='Calculus textbook',
            item_type='found',
            status='resolved',
            location='Cafeteria',
            date_lost_or_found=date(2026, 4, 11),
            owner=self.user,
            category=self.cat2,
        )

    def test_list_items_paginated(self):
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        titles = [item['title'] for item in _items_results(response)]
        self.assertIn('Lost iPhone', titles)
        self.assertIn('Found Textbook', titles)

    def test_filter_by_item_type(self):
        response = self.client.get('/api/items/', {'item_type': 'lost'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = _items_results(response)
        self.assertTrue(all(item['item_type'] == 'lost' for item in results))
        self.assertTrue(any(item['title'] == 'Lost iPhone' for item in results))

    def test_filter_by_category(self):
        response = self.client.get('/api/items/', {'category': self.cat2.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item['title'] for item in _items_results(response)]
        self.assertIn('Found Textbook', titles)

    def test_filter_by_status(self):
        response = self.client.get('/api/items/', {'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = _items_results(response)
        self.assertTrue(all(item['status'] == 'active' for item in results))
        self.assertTrue(any(item['title'] == 'Lost iPhone' for item in results))

    def test_search_by_title(self):
        response = self.client.get('/api/items/', {'search': 'iPhone'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = _items_results(response)
        self.assertTrue(any(item['title'] == 'Lost iPhone' for item in results))

    def test_search_by_description(self):
        response = self.client.get('/api/items/', {'search': 'Calculus'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = _items_results(response)
        self.assertTrue(any(item['title'] == 'Found Textbook' for item in results))

    def test_filter_no_results(self):
        response = self.client.get('/api/items/', {'item_type': 'found', 'status': 'claimed'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(_items_results(response)), 0)


class ItemDetailTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username='owner', password='Testpass1!')
        self.category, _ = Category.objects.get_or_create(name='Electronics')
        self.item = Item.objects.create(
            title='Lost iPhone',
            description='Black iPhone',
            item_type='lost',
            location='Library',
            date_lost_or_found=date(2026, 4, 10),
            owner=self.user,
            category=self.category,
        )

    def test_get_item_detail(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/items/{self.item.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Lost iPhone')
        self.assertEqual(response.data['category_name'], 'Electronics')
        self.assertEqual(response.data['owner_username'], 'owner')

    def test_get_item_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/items/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ItemUpdateTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(username='owner', password='Testpass1!')
        self.other_user = User.objects.create_user(username='other', password='Testpass1!')
        self.category, _ = Category.objects.get_or_create(name='Electronics')
        self.item = Item.objects.create(
            title='Lost iPhone',
            description='Black iPhone',
            item_type='lost',
            location='Library',
            date_lost_or_found=date(2026, 4, 10),
            owner=self.owner,
            category=self.category,
        )

    def test_update_item_owner_put(self):
        self.client.force_authenticate(user=self.owner)
        payload = {
            'title': 'Lost iPhone (updated)',
            'description': 'Updated description',
            'item_type': 'lost',
            'location': 'New Library',
            'date_lost_or_found': '2026-04-10',
            'category': self.category.pk,
        }
        response = self.client.put(f'/api/items/{self.item.pk}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Lost iPhone (updated)')

    def test_update_item_owner_patch(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f'/api/items/{self.item.pk}/',
            {'title': 'Patched title'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Patched title')

    def test_update_item_non_owner(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            f'/api/items/{self.item.pk}/',
            {'title': 'Hacked'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_item_unauthenticated(self):
        response = self.client.patch(
            f'/api/items/{self.item.pk}/',
            {'title': 'Hacked'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_status_is_read_only_via_serializer(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f'/api/items/{self.item.pk}/',
            {'status': 'resolved'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, 'active')

    def test_clear_image_removes_existing_image(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        png_bytes = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xff'
            b'\xff?\x00\x05\xfe\x02\xfe\xa3\x86\x9b\x12\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        self.item.image.save(
            'test.png', SimpleUploadedFile('test.png', png_bytes, 'image/png'), save=True
        )
        self.assertTrue(self.item.image.name)

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f'/api/items/{self.item.pk}/',
            {'clear_image': 'true'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertFalse(self.item.image.name)


class ItemDeleteTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(username='owner', password='Testpass1!')
        self.other_user = User.objects.create_user(username='other', password='Testpass1!')
        self.category, _ = Category.objects.get_or_create(name='Electronics')
        self.item = Item.objects.create(
            title='Lost iPhone',
            description='Black iPhone',
            item_type='lost',
            location='Library',
            date_lost_or_found=date(2026, 4, 10),
            owner=self.owner,
            category=self.category,
        )

    def test_delete_item_owner(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'/api/items/{self.item.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Item.objects.filter(pk=self.item.pk).exists())

    def test_delete_item_non_owner(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(f'/api/items/{self.item.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Item.objects.filter(pk=self.item.pk).exists())

    def test_delete_item_unauthenticated(self):
        response = self.client.delete(f'/api/items/{self.item.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Item.objects.filter(pk=self.item.pk).exists())


class ClaimFlowTests(_BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(username='owner', password='Testpass1!')
        self.claimant = User.objects.create_user(username='claimant', password='Testpass1!')
        self.other_user = User.objects.create_user(username='other', password='Testpass1!')
        self.category, _ = Category.objects.get_or_create(name='Electronics')

        self.active_item = Item.objects.create(
            title='Lost AirPods',
            description='White AirPods near the library',
            item_type='lost',
            location='Library',
            date_lost_or_found=date(2026, 4, 10),
            owner=self.owner,
            category=self.category,
        )
        self.resolved_item = Item.objects.create(
            title='Found Notebook',
            description='Blue notebook',
            item_type='found',
            status='resolved',
            location='Cafeteria',
            date_lost_or_found=date(2026, 4, 11),
            owner=self.owner,
            category=self.category,
        )

        self.pending_claim = Claim.objects.create(
            message='I can describe the serial number.',
            claimant=self.claimant,
            item=self.active_item,
        )
        self.approved_claim = Claim.objects.create(
            message='This is mine and I have proof.',
            claimant=self.other_user,
            item=self.resolved_item,
            status='approved',
        )

    def test_submit_claim_success(self):
        self.client.force_authenticate(user=self.other_user)
        payload = {'item': self.active_item.pk, 'message': 'This item belongs to me.'}
        response = self.client.post('/api/claims/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['item'], self.active_item.pk)

    def test_submit_claim_unauthenticated(self):
        payload = {'item': self.active_item.pk, 'message': 'No token.'}
        response = self.client.post('/api/claims/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submit_claim_own_item_forbidden(self):
        self.client.force_authenticate(user=self.owner)
        payload = {'item': self.active_item.pk, 'message': 'Trying to claim my own item.'}
        response = self.client.post('/api/claims/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'You cannot claim your own item.')

    def test_submit_claim_inactive_item_bad_request(self):
        self.client.force_authenticate(user=self.other_user)
        payload = {'item': self.resolved_item.pk, 'message': 'This should fail.'}
        response = self.client.post('/api/claims/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'You can only claim items with status "active".')

    def test_submit_duplicate_pending_claim_bad_request(self):
        self.client.force_authenticate(user=self.claimant)
        payload = {'item': self.active_item.pk, 'message': 'Second claim.'}
        response = self.client.post('/api/claims/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'You already have a pending claim for this item.')

    def test_get_my_claims_requires_auth(self):
        response = self.client.get('/api/claims/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_my_claims(self):
        self.client.force_authenticate(user=self.claimant)
        response = self.client.get('/api/claims/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['claimant_username'], 'claimant')

    def test_get_my_item_claims(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/claims/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_approve_claim_owner(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/claims/{self.pending_claim.pk}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pending_claim.refresh_from_db()
        self.assertEqual(self.pending_claim.status, 'approved')
        self.active_item.refresh_from_db()
        self.assertEqual(self.active_item.status, 'claimed')

    def test_approve_claim_rejects_sibling_pending_claims(self):
        sibling = Claim.objects.create(
            message='I am also claiming this item.',
            claimant=self.other_user,
            item=self.active_item,
        )
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/claims/{self.pending_claim.pk}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sibling.refresh_from_db()
        self.assertEqual(sibling.status, 'rejected')

    def test_approve_claim_already_approved_rejected(self):
        self.client.force_authenticate(user=self.owner)
        # First approval flips item to 'claimed' so the second call is blocked
        # both by the claim-state check and the item-state check.
        first = self.client.post(f'/api/claims/{self.pending_claim.pk}/approve/')
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        second = self.client.post(f'/api/claims/{self.pending_claim.pk}/approve/')
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_claim_non_owner_forbidden(self):
        self.client.force_authenticate(user=self.claimant)
        response = self.client.post(f'/api/claims/{self.pending_claim.pk}/approve/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_claim_not_found(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post('/api/claims/999999/approve/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reject_claim_owner(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/claims/{self.pending_claim.pk}/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pending_claim.refresh_from_db()
        self.assertEqual(self.pending_claim.status, 'rejected')

    def test_reject_claim_non_pending_rejected(self):
        self.client.force_authenticate(user=self.owner)
        first = self.client.post(f'/api/claims/{self.pending_claim.pk}/reject/')
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        second = self.client.post(f'/api/claims/{self.pending_claim.pk}/reject/')
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_claim_non_owner_forbidden(self):
        self.client.force_authenticate(user=self.claimant)
        response = self.client.post(f'/api/claims/{self.pending_claim.pk}/reject/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mark_resolved_owner(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/items/{self.active_item.pk}/mark-resolved/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.active_item.refresh_from_db()
        self.assertEqual(self.active_item.status, 'resolved')

    def test_mark_resolved_rejects_pending_claims(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/items/{self.active_item.pk}/mark-resolved/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pending_claim.refresh_from_db()
        self.assertEqual(self.pending_claim.status, 'rejected')

    def test_mark_resolved_already_resolved_rejected(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/items/{self.resolved_item.pk}/mark-resolved/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_resolved_non_owner_forbidden(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(f'/api/items/{self.active_item.pk}/mark-resolved/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mark_resolved_not_found(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post('/api/items/999999/mark-resolved/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
