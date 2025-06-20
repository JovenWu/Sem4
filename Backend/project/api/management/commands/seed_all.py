from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction

class Command(BaseCommand):
    help = 'Seeds the entire database with products, purchase orders, and sales records in the correct order'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-products',
            action='store_true',
            help='Skip seeding products (useful if products already exist)',
        )
        parser.add_argument(
            '--skip-purchase-orders',
            action='store_true',
            help='Skip seeding purchase orders',
        )
        parser.add_argument(
            '--skip-sales',
            action='store_true',
            help='Skip seeding sales records',
        )
        parser.add_argument(
            '--skip-suppliers',
            action='store_true',
            help='Skip seeding suppliers',
        )
        parser.add_argument(
            '--skip-customers',
            action='store_true',
            help='Skip seeding customers',
        )
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting complete database seeding...'))
        try:
            # Step 0: Clean existing data in the correct order (if not skipped)
            if not options['no_clean']:
                self.stdout.write('\n' + '='*50)
                self.stdout.write(self.style.SUCCESS('STEP 0: Cleaning Existing Data'))
                self.stdout.write('='*50)
                self.clean_existing_data()

            # Step 1: Seed Suppliers
            if not options.get('skip_suppliers'):
                self.stdout.write('\n' + '='*50)
                self.stdout.write(self.style.SUCCESS('STEP 1: Seeding Suppliers'))
                self.stdout.write('='*50)
                call_command('seed_suppliers', **({'no_clean': True} if options['no_clean'] else {}))
            else:
                self.stdout.write(self.style.WARNING('Skipping suppliers seeding...'))

            # Step 2: Seed Customers
            if not options.get('skip_customers'):
                self.stdout.write('\n' + '='*50)
                self.stdout.write(self.style.SUCCESS('STEP 2: Seeding Customers'))
                self.stdout.write('='*50)
                call_command('seed_customers', **({'no_clean': True} if options['no_clean'] else {}))
            else:
                self.stdout.write(self.style.WARNING('Skipping customers seeding...'))

            # Step 3: Seed Products and Categories
            if not options['skip_products']:
                self.stdout.write('\n' + '='*50)
                self.stdout.write(self.style.SUCCESS('STEP 3: Seeding Products and Categories'))
                self.stdout.write('='*50)
                call_command('seed_products', **({'no_clean': True} if options['no_clean'] else {}))
            else:
                self.stdout.write(self.style.WARNING('Skipping products seeding...'))

            # Step 4: Seed Purchase Orders (this will also update stock levels)
            if not options['skip_purchase_orders']:
                self.stdout.write('\n' + '='*50)
                self.stdout.write(self.style.SUCCESS('STEP 4: Seeding Purchase Orders'))
                self.stdout.write('='*50)
                call_command('seed_purchase_orders', **({'no_clean': True} if options['no_clean'] else {}))
            else:
                self.stdout.write(self.style.WARNING('Skipping purchase orders seeding...'))

            # Step 5: Seed Sales Records (this will reduce stock levels)
            if not options['skip_sales']:
                self.stdout.write('\n' + '='*50)
                self.stdout.write(self.style.SUCCESS('STEP 5: Seeding Sales Records'))
                self.stdout.write('='*50)
                call_command('seed_sales_records', **({'no_clean': True} if options['no_clean'] else {}))
            else:
                self.stdout.write(self.style.WARNING('Skipping sales records seeding...'))

            self.stdout.write('\n' + '='*50)
            self.stdout.write(self.style.SUCCESS('DATABASE SEEDING COMPLETED SUCCESSFULLY!'))
            self.stdout.write('='*50)
            # Display summary
            self.display_summary()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during seeding process: {e}')
            )
            raise

    def clean_existing_data(self):
        """Clean existing data in the correct order to avoid foreign key constraints"""
        from api.models import SalesRecords, PurchaseOrderItems, PurchaseOrders, Products, Categories, Supplier, Customer
        from django.db import connection
        self.stdout.write('Cleaning existing data in dependency order...')
        # Temporarily disable foreign key constraints for SQLite
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA foreign_keys = OFF;')
        try:
            # Delete in reverse dependency order
            sales_count = SalesRecords.objects.count()
            if sales_count > 0:
                SalesRecords.objects.all().delete()
                self.stdout.write(f'Deleted {sales_count} sales records')
            po_items_count = PurchaseOrderItems.objects.count()
            if po_items_count > 0:
                PurchaseOrderItems.objects.all().delete()
                self.stdout.write(f'Deleted {po_items_count} purchase order items')
            po_count = PurchaseOrders.objects.count()
            if po_count > 0:
                PurchaseOrders.objects.all().delete()
                self.stdout.write(f'Deleted {po_count} purchase orders')
            products_count = Products.objects.count()
            if products_count > 0:
                Products.objects.all().delete()
                self.stdout.write(f'Deleted {products_count} products')
            categories_count = Categories.objects.count()
            if categories_count > 0:
                Categories.objects.all().delete()
                self.stdout.write(f'Deleted {categories_count} categories')
            supplier_count = Supplier.objects.count()
            if supplier_count > 0:
                Supplier.objects.all().delete()
                self.stdout.write(f'Deleted {supplier_count} suppliers')
            customer_count = Customer.objects.count()
            if customer_count > 0:
                Customer.objects.all().delete()
                self.stdout.write(f'Deleted {customer_count} customers')
            self.stdout.write(self.style.SUCCESS('Data cleanup completed successfully!'))
        finally:
            # Re-enable foreign key constraints
            with connection.cursor() as cursor:
                cursor.execute('PRAGMA foreign_keys = ON;')

    def display_summary(self):
        """Display a summary of seeded data"""
        try:
            from api.models import Categories, Products, PurchaseOrders, PurchaseOrderItems, SalesRecords, Supplier, Customer
            categories_count = Categories.objects.count()
            products_count = Products.objects.count()
            purchase_orders_count = PurchaseOrders.objects.count()
            purchase_order_items_count = PurchaseOrderItems.objects.count()
            sales_records_count = SalesRecords.objects.count()
            supplier_count = Supplier.objects.count()
            customer_count = Customer.objects.count()
            self.stdout.write('\nSEEDING SUMMARY:')
            self.stdout.write('-' * 30)
            self.stdout.write(f'Categories: {categories_count}')
            self.stdout.write(f'Products: {products_count}')
            self.stdout.write(f'Suppliers: {supplier_count}')
            self.stdout.write(f'Customers: {customer_count}')
            self.stdout.write(f'Purchase Orders: {purchase_orders_count}')
            self.stdout.write(f'Purchase Order Items: {purchase_order_items_count}')
            self.stdout.write(f'Sales Records: {sales_records_count}')
            # Show date ranges
            if sales_records_count > 0:
                first_sale = SalesRecords.objects.order_by('transaction_date').first()
                last_sale = SalesRecords.objects.order_by('-transaction_date').first()
                self.stdout.write(f'Sales Date Range: {first_sale.transaction_date.date()} to {last_sale.transaction_date.date()}')
            if purchase_orders_count > 0:
                first_po = PurchaseOrders.objects.order_by('order_date').first()
                last_po = PurchaseOrders.objects.order_by('-order_date').first()
                self.stdout.write(f'Purchase Orders Date Range: {first_po.order_date} to {last_po.order_date}')
            self.stdout.write('\nNext steps:')
            self.stdout.write('1. Check the API endpoints to verify data')
            self.stdout.write('2. Test ML prediction models with: python manage.py test_ml_models')
            self.stdout.write('3. Generate training data with: POST /api/generate-ml-training-data/')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not display summary: {e}'))
