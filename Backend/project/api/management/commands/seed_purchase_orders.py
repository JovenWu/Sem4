import random
import uuid
from datetime import datetime, timedelta, date
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Products, PurchaseOrders, PurchaseOrderItems, Supplier

class Command(BaseCommand):
    help = 'Seeds the database with purchase orders data for the last 7 months (updated for normalized model)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options['no_clean']:
            self.stdout.write('Deleting existing purchase orders...')
            PurchaseOrderItems.objects.all().delete()
            PurchaseOrders.objects.all().delete()
        else:
            self.stdout.write('Skipping purchase orders cleanup (--no-clean flag used)...')
        self.stdout.write('Creating purchase orders...')
        products = list(Products.objects.all())
        suppliers = list(Supplier.objects.all())
        if not products:
            self.stdout.write(self.style.ERROR('No products found. Please run seed_products first.'))
            return
        if not suppliers:
            self.stdout.write(self.style.ERROR('No suppliers found. Please run seed_suppliers first.'))
            return
        end_date = date.today()
        start_date = end_date - timedelta(days=210)
        current_date = start_date
        po_count = 0
        while current_date <= end_date:
            if current_date.weekday() in [0, 2, 4]:
                num_pos = random.randint(1, 3)
                for _ in range(num_pos):
                    po = self.create_purchase_order(current_date, products, suppliers)
                    if po:
                        po_count += 1
                        if po_count % 10 == 0:
                            self.stdout.write(f'Created {po_count} purchase orders...')
            current_date += timedelta(days=1)
        self.stdout.write(self.style.SUCCESS(f'Successfully created {po_count} purchase orders from {start_date} to {end_date}'))

    def create_purchase_order(self, order_date, products, suppliers):
        try:
            supplier = random.choice(suppliers)
            delivery_date = order_date + timedelta(days=random.randint(3, 14))
            status = 'Received' if random.random() < 0.9 else 'Ordered'
            po_id = str(uuid.uuid4())
            po = PurchaseOrders.objects.create(
                po_id=po_id,
                supplier=supplier,
                order_date=order_date,
                expected_delivery_date=delivery_date,
                status=status,
                notes=f'Restocking order from {supplier.name}'
            )
            num_products = random.randint(1, 5)
            selected_products = random.sample(products, min(num_products, len(products)))
            for product in selected_products:
                quantity = self.calculate_order_quantity(product)
                cost_multiplier = random.uniform(0.6, 0.8)
                unit_cost = round(product.unit_price * cost_multiplier, 2)
                PurchaseOrderItems.objects.create(
                    purchase_order=po,
                    product=product,
                    ordered_quantity=quantity,
                    received_quantity=quantity if status == 'Received' else 0,
                    unit_cost_price=unit_cost
                )
                if status == 'Received':
                    product.current_stock += quantity
                    product.save()
            return po
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating purchase order: {e}'))
            return None

    def calculate_order_quantity(self, product):
        category_name = product.category.name if product.category else 'Unknown'
        base_quantities = {
            'Groceries': random.randint(40, 160),
            'Electronics': random.randint(10, 40),
            'Clothing': random.randint(20, 60),
            'Furniture': random.randint(4, 16),
            'Toys': random.randint(16, 50),
        }
        base_qty = base_quantities.get(category_name, random.randint(100, 300))
        if product.unit_price > 70:
            base_qty = int(base_qty * 0.5)
        elif product.unit_price > 50:
            base_qty = int(base_qty * 0.7)
        elif product.unit_price < 30:
            base_qty = int(base_qty * 1.3)
        variation = random.uniform(0.8, 1.2)
        final_qty = max(10, int(base_qty * variation))
        return final_qty
