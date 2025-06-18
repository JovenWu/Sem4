import uuid
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Products, Categories 

SEED_DATA = [
    {'product_id': 'P0001', 'category_name': 'Groceries', 'product_name': 'Gourmet Coffee Trio', 'unit_price': 54.948, 'competitor_price': 52.674, 'current_stock': 255},
    {'product_id': 'P0002', 'category_name': 'Furniture', 'product_name': 'Metal Floor Lamp', 'unit_price': 74.094, 'competitor_price': 74.256, 'current_stock': 36},
    {'product_id': 'P0003', 'category_name': 'Groceries', 'product_name': 'Family Frozen Lasagna', 'unit_price': 48.922, 'competitor_price': 48.61, 'current_stock': 288},
    {'product_id': 'P0004', 'category_name': 'Electronics', 'product_name': 'Bluetooth Earbuds', 'unit_price': 51.728, 'competitor_price': 52.388, 'current_stock': 102},
    {'product_id': 'P0005', 'category_name': 'Groceries', 'product_name': 'Fresh Berry Yogurt Pack', 'unit_price': 30.384, 'competitor_price': 29.326, 'current_stock': 360},
    {'product_id': 'P0006', 'category_name': 'Groceries', 'product_name': 'Mixed Nuts & Fruit Tray', 'unit_price': 52.718, 'competitor_price': 52.908, 'current_stock': 234},
    {'product_id': 'P0007', 'category_name': 'Electronics', 'product_name': 'Waterproof BT Speaker', 'unit_price': 52.21, 'competitor_price': 52.498, 'current_stock': 84},
    {'product_id': 'P0008', 'category_name': 'Electronics', 'product_name': 'Wired Gaming Mouse', 'unit_price': 44.564, 'competitor_price': 42.598, 'current_stock': 135},
    {'product_id': 'P0009', 'category_name': 'Furniture', 'product_name': 'Small Wooden Bookshelf', 'unit_price': 52.628, 'competitor_price': 53.278, 'current_stock': 45},
    {'product_id': 'P0010', 'category_name': 'Toys', 'product_name': 'RC Robot Builder Kit', 'unit_price': 66.478, 'competitor_price': 67.59, 'current_stock': 60},
    {'product_id': 'P0011', 'category_name': 'Electronics', 'product_name': 'HD Webcam w/ Mic', 'unit_price': 54.32, 'competitor_price': 55.71, 'current_stock': 96},
    {'product_id': 'P0012', 'category_name': 'Clothing', 'product_name': 'Men\'s Dress Shirt', 'unit_price': 53.72, 'competitor_price': 53.014, 'current_stock': 144},
    {'product_id': 'P0013', 'category_name': 'Groceries', 'product_name': 'Large Salmon Fillet (3lb)', 'unit_price': 75.418, 'competitor_price': 74.3, 'current_stock': 204},
    {'product_id': 'P0014', 'category_name': 'Toys', 'product_name': 'Kids Learning Tablet', 'unit_price': 53.162, 'competitor_price': 55.806, 'current_stock': 72},
    {'product_id': 'P0015', 'category_name': 'Furniture', 'product_name': 'Floating Wall Shelves (2)', 'unit_price': 59.696, 'competitor_price': 60.558, 'current_stock': 54},
    {'product_id': 'P0016', 'category_name': 'Groceries', 'product_name': 'Gourmet Pasta & Sauce', 'unit_price': 36.936, 'competitor_price': 36.648, 'current_stock': 216},
    {'product_id': 'P0017', 'category_name': 'Clothing', 'product_name': 'Quilted Puffer Vest', 'unit_price': 58.888, 'competitor_price': 59.648, 'current_stock': 108},
    {'product_id': 'P0018', 'category_name': 'Electronics', 'product_name': 'Studio Monitor Headphones', 'unit_price': 77.052, 'competitor_price': 76.024, 'current_stock': 48},
    {'product_id': 'P0019', 'category_name': 'Clothing', 'product_name': 'Cotton Baseball Cap', 'unit_price': 23.956, 'competitor_price': 25.176, 'current_stock': 192},
    {'product_id': 'P0020', 'category_name': 'Toys', 'product_name': 'Giant Craft Box Kit', 'unit_price': 45.588, 'competitor_price': 44.568, 'current_stock': 87},
]

class Command(BaseCommand):
    help = 'Seeds the database with initial product data, using model field names in SEED_DATA.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options['no_clean']:
            self.stdout.write('Deleting existing Product and Categories data...')
            Products.objects.all().delete()
            Categories.objects.all().delete()
        else:
            self.stdout.write('Skipping data cleanup (--no-clean flag used)...')

        self.stdout.write('Creating categories...')
        category_objects = {}
        # Use 'category_name' from the updated SEED_DATA
        unique_category_names = sorted(list(set(item['category_name'] for item in SEED_DATA)))

        for cat_name_str in unique_category_names:
            category, created = Categories.objects.get_or_create(name=cat_name_str)
            category_objects[cat_name_str] = category
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created category "{cat_name_str}" with ID "{category.category_id}"'))
            else:
                self.stdout.write(self.style.WARNING(f'Category "{cat_name_str}" already existed with ID "{category.category_id}"'))

        self.stdout.write('Creating products...')
        for item_data in SEED_DATA:
            category_name_str = item_data['category_name']
            category_instance = category_objects.get(category_name_str)

            if not category_instance:
                self.stdout.write(self.style.ERROR(f"Category '{category_name_str}' not found for product ID '{item_data['product_id']}'. Skipping."))
                continue

            # Prepare defaults dictionary, excluding product_id (used as lookup) and category_name (used for FK)
            defaults_for_product = {
                'category': category_instance,
                'product_name': item_data['product_name'],
                'unit_price': item_data['unit_price'],
                'competitor_price': item_data.get('competitor_price'), # Use .get() for optional fields
                'current_stock': item_data['current_stock'],
            }

            product, created = Products.objects.get_or_create(
                product_id=item_data['product_id'], # Lookup by product_id
                defaults=defaults_for_product
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created product "{product.product_name}" (ID: {product.product_id})'))
            else:
                self.stdout.write(self.style.WARNING(f'Product "{product.product_name}" with ID "{product.product_id}" already existed.'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database.'))