import uuid
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Supplier

SUPPLIER_SEED_DATA = [
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'Global Electronics Supply Co.',
        'contact_person': 'John Smith',
        'phone': '123-456-7890',
        'email': 'contact@globalelectronics.com',
        'address': '123 Main St, City, Country',
    },
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'FreshFood Distribution Inc.',
        'contact_person': 'Jane Doe',
        'phone': '234-567-8901',
        'email': 'info@freshfood.com',
        'address': '456 Market Ave, City, Country',
    },
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'Premium Furniture Warehouse',
        'contact_person': 'Alice Johnson',
        'phone': '345-678-9012',
        'email': 'sales@premiumfurniture.com',
        'address': '789 Industrial Rd, City, Country',
    },
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'ToyWorld Manufacturing Ltd.',
        'contact_person': 'Bob Lee',
        'phone': '456-789-0123',
        'email': 'support@toyworld.com',
        'address': '101 Toy St, City, Country',
    },
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'Fashion Forward Apparel',
        'contact_person': 'Emily Clark',
        'phone': '567-890-1234',
        'email': 'hello@fashionforward.com',
        'address': '202 Fashion Ave, City, Country',
    },
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'TechGear Solutions',
        'contact_person': 'Michael Brown',
        'phone': '678-901-2345',
        'email': 'contact@techgear.com',
        'address': '303 Tech Park, City, Country',
    },
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'Home & Living Supplies',
        'contact_person': 'Sarah Wilson',
        'phone': '789-012-3456',
        'email': 'info@homeandliving.com',
        'address': '404 Home St, City, Country',
    },
    {
        'supplier_id': str(uuid.uuid4()),
        'name': 'Daily Essentials Co.',
        'contact_person': 'David Kim',
        'phone': '890-123-4567',
        'email': 'contact@dailyessentials.com',
        'address': '505 Daily Rd, City, Country',
    },
]

class Command(BaseCommand):
    help = 'Seeds the database with supplier data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options['no_clean']:
            self.stdout.write('Deleting existing suppliers...')
            Supplier.objects.all().delete()
        else:
            self.stdout.write('Skipping suppliers cleanup (--no-clean flag used)...')

        self.stdout.write('Creating suppliers...')
        for data in SUPPLIER_SEED_DATA:
            Supplier.objects.update_or_create(
                name=data['name'],
                defaults=data
            )
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(SUPPLIER_SEED_DATA)} suppliers.'))
