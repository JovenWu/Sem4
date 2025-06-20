import random
from datetime import datetime, timedelta, date, time
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Products, SalesTransaction, SalesRecordItem, Customer

class Command(BaseCommand):
    help = 'Seeds the database with sales transactions and items for the last 6+ months (normalized model)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options['no_clean']:
            self.stdout.write('Deleting existing sales transactions and items...')
            SalesRecordItem.objects.all().delete()
            SalesTransaction.objects.all().delete()
        else:
            self.stdout.write('Skipping cleanup (--no-clean flag used)...')

        self.stdout.write('Creating realistic sales transactions and items...')
        products = list(Products.objects.all())
        customers = list(Customer.objects.all())
        if not products:
            self.stdout.write(self.style.ERROR('No products found. Please run seed_products first.'))
            return
        end_date = date.today()
        start_date = end_date - timedelta(days=195)
        current_date = start_date
        total_transactions = 0
        while current_date <= end_date:
            num_transactions = random.randint(2, 8)
            for _ in range(num_transactions):
                transaction_time = datetime.combine(current_date, time(random.randint(8, 20), random.randint(0, 59), random.randint(0, 59)))
                customer = random.choice(customers) if customers and random.random() < 0.7 else None
                sales_transaction = SalesTransaction.objects.create(
                    transaction_date=transaction_time,
                    customer=customer
                )
                # Each transaction can have 1-4 items
                items_in_transaction = random.sample(products, k=random.randint(1, min(4, len(products))))
                for product in items_in_transaction:
                    quantity = random.randint(1, 5)
                    sale_price = round(product.unit_price * random.uniform(0.9, 1.1), 2)
                    discount = round(random.uniform(0, 0.2) * sale_price, 2) if random.random() < 0.2 else 0.0
                    promotion = discount > 0
                    SalesRecordItem.objects.create(
                        transaction=sales_transaction,
                        product=product,
                        quantity_sold=quantity,
                        unit_price_at_sale=sale_price,
                        discount_applied=discount,
                        promotion_marker=promotion
                    )
                total_transactions += 1
            if total_transactions % 100 == 0:
                self.stdout.write(f'Created {total_transactions} sales transactions...')
            current_date += timedelta(days=1)
        self.stdout.write(self.style.SUCCESS(f'Successfully created {total_transactions} sales transactions from {start_date} to {end_date}'))
