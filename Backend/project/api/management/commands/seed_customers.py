import uuid
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Customer

CUSTOMER_SEED_DATA = [
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Acme Retailers',
        'phone': '111-222-3333',
        'email': 'info@acmeretailers.com',
        'address': '1 Acme Plaza, City, Country',
    },
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Sunshine Mart',
        'phone': '222-333-4444',
        'email': 'contact@sunshinemart.com',
        'address': '2 Sunshine Blvd, City, Country',
    },
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Techie Gadgets',
        'phone': '333-444-5555',
        'email': 'hello@techiegadgets.com',
        'address': '3 Tech Park, City, Country',
    },
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Family Superstore',
        'phone': '444-555-6666',
        'email': 'support@familysuperstore.com',
        'address': '4 Family Rd, City, Country',
    },
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Urban Outfitters',
        'phone': '555-666-7777',
        'email': 'contact@urbanoutfitters.com',
        'address': '5 Urban Ave, City, Country',
    },
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Green Grocers',
        'phone': '666-777-8888',
        'email': 'info@greengrocers.com',
        'address': '6 Green St, City, Country',
    },
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Kids World',
        'phone': '777-888-9999',
        'email': 'hello@kidsworld.com',
        'address': '7 Kids Lane, City, Country',
    },
    {
        'customer_id': str(uuid.uuid4()),
        'name': 'Mega Electronics',
        'phone': '888-999-0000',
        'email': 'sales@megaelectronics.com',
        'address': '8 Mega Park, City, Country',
    },
]

class Command(BaseCommand):
    help = 'Seeds the database with customer data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options['no_clean']:
            self.stdout.write('Deleting existing customers...')
            Customer.objects.all().delete()
        else:
            self.stdout.write('Skipping customers cleanup (--no-clean flag used)...')

        self.stdout.write('Creating customers...')
        for data in CUSTOMER_SEED_DATA:
            Customer.objects.update_or_create(
                name=data['name'],
                defaults=data
            )
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(CUSTOMER_SEED_DATA)} customers.'))
