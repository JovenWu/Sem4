from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Products

class Command(BaseCommand):
    help = 'Interactive stock editor - browse and edit product stock levels one by one'

    def add_arguments(self, parser):
        parser.add_argument(
            '--category',
            type=str,
            help='Filter by category name (optional)'
        )
        parser.add_argument(
            '--min-stock',
            type=int,
            help='Show only products with stock >= this value'
        )
        parser.add_argument(
            '--max-stock',
            type=int,
            help='Show only products with stock <= this value'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Interactive Stock Editor ==='))
        self.stdout.write('Commands: (n)ext, (e)dit, (s)kip, (q)uit, (l)ist all, (f)ilter')
        self.stdout.write('-' * 50)
        
        # Get filtered products
        products = self.get_filtered_products(options)
        
        if not products:
            self.stdout.write(self.style.ERROR('No products found with the given filters.'))
            return
        
        self.stdout.write(f'Found {len(products)} products to review.')
        self.stdout.write('')
        
        current_index = 0
        
        while current_index < len(products):
            product = products[current_index]
            
            # Display current product
            self.display_product(product, current_index + 1, len(products))
            
            # Get user input
            try:
                command = input('\nAction [n/e/s/q/l/f]: ').strip().lower()
            except (EOFError, KeyboardInterrupt):
                self.stdout.write('\n\nExiting...')
                break
            
            if command in ['n', 'next', '']:
                current_index += 1
            elif command in ['e', 'edit']:
                if self.edit_product(product):
                    current_index += 1
            elif command in ['s', 'skip']:
                current_index += 1
            elif command in ['q', 'quit']:
                break
            elif command in ['l', 'list']:
                self.list_all_products(products)
            elif command in ['f', 'filter']:
                products = self.interactive_filter()
                current_index = 0
            else:
                self.stdout.write('Invalid command. Use n/e/s/q/l/f')
        
        self.stdout.write(self.style.SUCCESS('\nStock editing session completed.'))

    def get_filtered_products(self, options):
        """Get products based on filters"""
        queryset = Products.objects.select_related('category').all()
        
        if options['category']:
            queryset = queryset.filter(category__name__icontains=options['category'])
        
        if options['min_stock'] is not None:
            queryset = queryset.filter(current_stock__gte=options['min_stock'])
        
        if options['max_stock'] is not None:
            queryset = queryset.filter(current_stock__lte=options['max_stock'])
        
        return list(queryset.order_by('product_id'))

    def display_product(self, product, current, total):
        """Display product information"""
        self.stdout.write(f'\n[{current}/{total}] Product: {product.product_id}')
        self.stdout.write(f'Name: {product.product_name}')
        self.stdout.write(f'Category: {product.category.name if product.category else "No Category"}')
        self.stdout.write(f'Price: ${product.unit_price}')
        self.stdout.write(f'Current Stock: {product.current_stock}')
        
        # Show stock status
        if product.current_stock < 10:
            self.stdout.write(self.style.ERROR('  ⚠️  Very Low Stock'))
        elif product.current_stock < 50:
            self.stdout.write(self.style.WARNING('  ⚠️  Low Stock'))
        elif product.current_stock > 500:
            self.stdout.write(self.style.WARNING('  📦 High Stock (possible outlier)'))

    def edit_product(self, product):
        """Edit a single product's stock"""
        try:
            self.stdout.write(f'\nEditing: {product.product_name}')
            self.stdout.write(f'Current stock: {product.current_stock}')
            
            new_stock = input('Enter new stock level (or press Enter to cancel): ').strip()
            
            if not new_stock:
                self.stdout.write('Edit cancelled.')
                return False
            
            try:
                new_stock = int(new_stock)
                if new_stock < 0:
                    self.stdout.write(self.style.ERROR('Stock cannot be negative.'))
                    return False
                
                # Confirm the change
                self.stdout.write(f'Change stock from {product.current_stock} to {new_stock}?')
                confirm = input('Confirm (y/N): ').strip().lower()
                
                if confirm in ['y', 'yes']:
                    with transaction.atomic():
                        product.current_stock = new_stock
                        product.save()
                    
                    self.stdout.write(self.style.SUCCESS(f'✅ Stock updated to {new_stock}'))
                    return True
                else:
                    self.stdout.write('Change cancelled.')
                    return False
                    
            except ValueError:
                self.stdout.write(self.style.ERROR('Invalid number. Please enter a valid integer.'))
                return False
                
        except (EOFError, KeyboardInterrupt):
            self.stdout.write('\nEdit cancelled.')
            return False

    def list_all_products(self, products):
        """List all products in current filter"""
        self.stdout.write('\n=== Current Product List ===')
        for i, product in enumerate(products, 1):
            stock_indicator = ''
            if product.current_stock < 10:
                stock_indicator = ' 🔴'
            elif product.current_stock < 50:
                stock_indicator = ' 🟡'
            elif product.current_stock > 500:
                stock_indicator = ' 📦'
            
            self.stdout.write(
                f'{i:2d}. {product.product_id} - {product.product_name[:30]:<30} '
                f'Stock: {product.current_stock:>4d}{stock_indicator}'
            )
        self.stdout.write('')

    def interactive_filter(self):
        """Interactive filtering"""
        try:
            self.stdout.write('\n=== Filter Products ===')
            category = input('Category (or Enter for all): ').strip()
            
            min_stock_input = input('Minimum stock (or Enter for no limit): ').strip()
            min_stock = int(min_stock_input) if min_stock_input else None
            
            max_stock_input = input('Maximum stock (or Enter for no limit): ').strip()
            max_stock = int(max_stock_input) if max_stock_input else None
            
            # Apply filters
            queryset = Products.objects.select_related('category').all()
            
            if category:
                queryset = queryset.filter(category__name__icontains=category)
            
            if min_stock is not None:
                queryset = queryset.filter(current_stock__gte=min_stock)
            
            if max_stock is not None:
                queryset = queryset.filter(current_stock__lte=max_stock)
            
            products = list(queryset.order_by('product_id'))
            self.stdout.write(f'Filter applied. Found {len(products)} products.')
            return products
            
        except (ValueError, EOFError, KeyboardInterrupt):
            self.stdout.write('Filter cancelled.')
            return Products.objects.select_related('category').all().order_by('product_id')
