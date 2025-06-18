import random
from datetime import datetime, timedelta, date
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Products, PurchaseOrders, PurchaseOrderItems

class Command(BaseCommand):
    help = 'Seeds the database with purchase orders data for the last 7 months'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    SUPPLIERS = [
        'Global Electronics Supply Co.',
        'FreshFood Distribution Inc.',
        'Premium Furniture Warehouse',
        'ToyWorld Manufacturing Ltd.',
        'Fashion Forward Apparel',
        'TechGear Solutions',
        'Home & Living Supplies',
        'Daily Essentials Co.',
    ]

    @transaction.atomic
    def handle(self, *args, **options):
        if not options['no_clean']:
            self.stdout.write('Deleting existing purchase orders...')
            PurchaseOrderItems.objects.all().delete()
            PurchaseOrders.objects.all().delete()
        else:
            self.stdout.write('Skipping purchase orders cleanup (--no-clean flag used)...')
        
        self.stdout.write('Creating purchase orders...')
        
        # Get all products
        products = list(Products.objects.all())
        if not products:
            self.stdout.write(self.style.ERROR('No products found. Please run seed_products first.'))
            return

        # Calculate date range (7 months back from now)
        end_date = date.today()
        start_date = end_date - timedelta(days=210)  # About 7 months

        # Generate purchase orders
        current_date = start_date
        po_count = 0

        while current_date <= end_date:
            # Generate 1-3 purchase orders per week
            if current_date.weekday() in [0, 2, 4]:  # Monday, Wednesday, Friday
                num_pos = random.randint(1, 3)
                
                for _ in range(num_pos):
                    po = self.create_purchase_order(current_date, products)
                    if po:
                        po_count += 1
                        if po_count % 10 == 0:
                            self.stdout.write(f'Created {po_count} purchase orders...')
            
            current_date += timedelta(days=1)

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {po_count} purchase orders from {start_date} to {end_date}')
        )

    def create_purchase_order(self, order_date, products):
        """Create a single purchase order with random products"""
        try:
            # Random supplier
            supplier = random.choice(self.SUPPLIERS)
            
            # Expected delivery: 3-14 days after order
            delivery_date = order_date + timedelta(days=random.randint(3, 14))
            
            # Status: 90% received, 10% ordered
            status = 'Received' if random.random() < 0.9 else 'Ordered'
            
            # Create the purchase order
            po = PurchaseOrders.objects.create(
                supplier_name=supplier,
                order_date=order_date,
                expected_delivery_date=delivery_date,
                status=status,
                notes=f'Restocking order from {supplier}'
            )
            
            # Add 1-5 different products to this PO
            num_products = random.randint(1, 5)
            selected_products = random.sample(products, min(num_products, len(products)))
            
            for product in selected_products:
                # Calculate order quantity based on category and expected sales
                quantity = self.calculate_order_quantity(product)
                
                # Cost price is typically 60-80% of selling price
                cost_multiplier = random.uniform(0.6, 0.8)
                unit_cost = round(product.unit_price * cost_multiplier, 2)
                
                # Create purchase order item
                PurchaseOrderItems.objects.create(
                    purchase_order=po,
                    product=product,
                    ordered_quantity=quantity,
                    received_quantity=quantity if status == 'Received' else 0,
                    unit_cost_price=unit_cost
                )
                
                # Update stock if received
                if status == 'Received':
                    product.current_stock += quantity
                    product.save()
            
            return po
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating purchase order: {e}')
            )
            return None

    def calculate_order_quantity(self, product):
        """Calculate realistic order quantities based on product category and price"""
        category_name = product.category.name if product.category else 'Unknown'
          # Base quantities by category (WEEKLY supply - reduced by 80%)
        base_quantities = {
            'Groceries': random.randint(40, 160),       # Was 200-800, now weekly supply
            'Electronics': random.randint(10, 40),      # Was 50-200, now weekly supply  
            'Clothing': random.randint(20, 60),         # Was 100-300, now weekly supply
            'Furniture': random.randint(4, 16),         # Was 20-80, now weekly supply
            'Toys': random.randint(16, 50),            # Was 80-250, now weekly supply
        }
        
        base_qty = base_quantities.get(category_name, random.randint(100, 300))
        
        # Adjust based on price (expensive items = lower quantities)
        if product.unit_price > 70:
            base_qty = int(base_qty * 0.5)  # Reduce by 50% for expensive items
        elif product.unit_price > 50:
            base_qty = int(base_qty * 0.7)  # Reduce by 30% for medium-priced items
        elif product.unit_price < 30:
            base_qty = int(base_qty * 1.3)  # Increase by 30% for cheap items
        
        # Add some randomness (±20%)
        variation = random.uniform(0.8, 1.2)
        final_qty = max(10, int(base_qty * variation))  # Minimum 10 units
        
        return final_qty
