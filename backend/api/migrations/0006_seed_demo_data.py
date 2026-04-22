# Generated for demo data

from datetime import date

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def seed_demo_data(apps, schema_editor):
    # Demo accounts ship with hardcoded passwords; never seed them outside of
    # local development.
    if not settings.DEBUG:
        return

    User = apps.get_model('auth', 'User')
    Category = apps.get_model('api', 'Category')
    Item = apps.get_model('api', 'Item')
    Claim = apps.get_model('api', 'Claim')

    owner, _ = User.objects.get_or_create(
        username='demo_owner',
        defaults={
            'email': 'demo_owner@example.com',
            'password': make_password('Passw0rd!'),
        },
    )
    claimant, _ = User.objects.get_or_create(
        username='demo_claimant',
        defaults={
            'email': 'demo_claimant@example.com',
            'password': make_password('Passw0rd!'),
        },
    )

    categories = {cat.name: cat for cat in Category.objects.all()}

    items = {
        'lost_phone': Item.objects.get_or_create(
            title='Lost iPhone 15',
            defaults={
                'description': 'Black iPhone lost near the main library.',
                'item_type': 'lost',
                'status': 'claimed',
                'location': 'Main Library',
                'date_lost_or_found': date(2026, 4, 10),
                'owner': owner,
                'category': categories['Electronics'],
            },
        )[0],
        'found_backpack': Item.objects.get_or_create(
            title='Found Blue Backpack',
            defaults={
                'description': 'Blue backpack with a laptop sleeve.',
                'item_type': 'found',
                'status': 'active',
                'location': 'Cafeteria',
                'date_lost_or_found': date(2026, 4, 11),
                'owner': claimant,
                'category': categories['Bags'],
            },
        )[0],
        'lost_id': Item.objects.get_or_create(
            title='Lost Student ID',
            defaults={
                'description': 'Student ID card with a blue lanyard.',
                'item_type': 'lost',
                'status': 'active',
                'location': 'Building C',
                'date_lost_or_found': date(2026, 4, 12),
                'owner': owner,
                'category': categories['Documents'],
            },
        )[0],
        'found_headphones': Item.objects.get_or_create(
            title='Found Headphones',
            defaults={
                'description': 'Wireless headphones in a black case.',
                'item_type': 'found',
                'status': 'resolved',
                'location': 'Gym',
                'date_lost_or_found': date(2026, 4, 13),
                'owner': claimant,
                'category': categories['Electronics'],
            },
        )[0],
        'lost_keys': Item.objects.get_or_create(
            title='Lost Keys',
            defaults={
                'description': 'Set of two keys with a red keychain.',
                'item_type': 'lost',
                'status': 'active',
                'location': 'Dormitory',
                'date_lost_or_found': date(2026, 4, 14),
                'owner': claimant,
                'category': categories['Accessories'],
            },
        )[0],
        'found_notebook': Item.objects.get_or_create(
            title='Found Notebook',
            defaults={
                'description': 'Green notebook with handwritten notes.',
                'item_type': 'found',
                'status': 'active',
                'location': 'Lecture Hall 3',
                'date_lost_or_found': date(2026, 4, 15),
                'owner': owner,
                'category': categories['Documents'],
            },
        )[0],
    }

    Claim.objects.get_or_create(
        claimant=claimant,
        item=items['lost_phone'],
        defaults={
            'message': 'I can describe the lock screen wallpaper and the case.',
            'status': 'approved',
        },
    )
    Claim.objects.get_or_create(
        claimant=owner,
        item=items['found_backpack'],
        defaults={
            'message': 'The backpack has my laptop charger inside.',
            'status': 'pending',
        },
    )
    Claim.objects.get_or_create(
        claimant=claimant,
        item=items['lost_id'],
        defaults={
            'message': 'The ID card belongs to me; I lost it in the hallway.',
            'status': 'pending',
        },
    )
    Claim.objects.get_or_create(
        claimant=owner,
        item=items['found_headphones'],
        defaults={
            'message': 'These headphones are mine.',
            'status': 'rejected',
        },
    )


def remove_demo_data(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Item = apps.get_model('api', 'Item')
    Claim = apps.get_model('api', 'Claim')

    Claim.objects.filter(claimant__username__in=['demo_owner', 'demo_claimant']).delete()
    Item.objects.filter(title__in=[
        'Lost iPhone 15',
        'Found Blue Backpack',
        'Lost Student ID',
        'Found Headphones',
        'Lost Keys',
        'Found Notebook',
    ]).delete()
    User.objects.filter(username__in=['demo_owner', 'demo_claimant']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_claim_unique_together_claim_updated_at_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_demo_data, remove_demo_data),
    ]