from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Category, Item


class CategoryTests(APITestCase):
    def setUp(self):
        Category.objects.get_or_create(name='Electronics', defaults={'description': 'Electronic devices'})
        Category.objects.get_or_create(name='Books', defaults={'description': 'Textbooks and notebooks'})

    def test_list_categories(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_list_categories_unauthenticated(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ItemCreateTests(APITestCase):
    def setUp(self):
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


class ItemListTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='owner', password='Testpass1!')
        self.cat1, _ = Category.objects.get_or_create(name='Electronics')
        self.cat2, _ = Category.objects.get_or_create(name='Books')
        Item.objects.create(
            title='Lost iPhone',
            description='Black iPhone',
            item_type='lost',
            status='active',
            location='Library',
            date_lost_or_found=date(2026, 4, 10),
            owner=self.user,
            category=self.cat1,
        )
        Item.objects.create(
            title='Found Textbook',
            description='Calculus textbook',
            item_type='found',
            status='resolved',
            location='Cafeteria',
            date_lost_or_found=date(2026, 4, 11),
            owner=self.user,
            category=self.cat2,
        )

    def test_list_items(self):
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_filter_by_item_type(self):
        response = self.client.get('/api/items/', {'item_type': 'lost'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['item_type'], 'lost')

    def test_filter_by_category(self):
        response = self.client.get('/api/items/', {'category': self.cat2.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Found Textbook')

    def test_filter_by_status(self):
        response = self.client.get('/api/items/', {'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Lost iPhone')

    def test_search_by_title(self):
        response = self.client.get('/api/items/', {'search': 'iPhone'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_search_by_description(self):
        response = self.client.get('/api/items/', {'search': 'Calculus'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filter_no_results(self):
        response = self.client.get('/api/items/', {'item_type': 'found', 'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class ItemDetailTests(APITestCase):
    def setUp(self):
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


class ItemUpdateTests(APITestCase):
    def setUp(self):
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


class ItemDeleteTests(APITestCase):
    def setUp(self):
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
