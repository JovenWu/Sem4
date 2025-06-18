import random
from datetime import datetime, timedelta, date, time
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Products, SalesRecords

class Command(BaseCommand):
    help = 'Seeds the database with diverse and realistic sales records data for the last 6+ months'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clean',
            action='store_true',
            help='Skip cleaning existing data (add to existing data instead of replacing)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options['no_clean']:
            self.stdout.write('Deleting existing sales records...')
            SalesRecords.objects.all().delete()
        else:
            self.stdout.write('Skipping sales records cleanup (--no-clean flag used)...')
        
        self.stdout.write('Creating realistic sales records with product diversity...')
        
        # Get all products
        products = list(Products.objects.all())
        if not products:
            self.stdout.write(self.style.ERROR('No products found. Please run seed_products first.'))
            return

        # Calculate date range (6.5 months back from now)
        end_date = date.today()
        start_date = end_date - timedelta(days=195)  # About 6.5 months

        # Initialize product characteristics
        self.initialize_product_characteristics(products, start_date, end_date)

        # Generate sales records
        current_date = start_date
        total_sales = 0

        while current_date <= end_date:
            daily_sales = self.generate_daily_sales(current_date, products)
            total_sales += daily_sales
            
            if total_sales % 100 == 0:
                self.stdout.write(f'Created {total_sales} sales records...')
            
            current_date += timedelta(days=1)

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {total_sales} diverse sales records from {start_date} to {end_date}')
        )

    def initialize_product_characteristics(self, products, start_date, end_date):
        """Initialize unique characteristics for each product"""
        self.product_profiles = {}
        
        for product in products:
            # Assign product lifecycle stage
            lifecycle_stages = ['New', 'Growing', 'Mature', 'Declining']
            lifecycle_weights = [0.15, 0.25, 0.45, 0.15]  # Most products are mature
            
            # Assign performance tier (affects base sales)
            performance_tiers = ['Poor', 'Average', 'Good', 'Excellent']
            performance_weights = [0.10, 0.40, 0.35, 0.15]
            
            # Assign volatility (how much sales vary day to day)
            volatility_levels = ['Low', 'Medium', 'High']
            volatility_weights = [0.30, 0.50, 0.20]
            
            # Generate special events for some products
            special_events = self.generate_special_events(start_date, end_date)
            
            self.product_profiles[product.product_id] = {
                'lifecycle': random.choices(lifecycle_stages, weights=lifecycle_weights)[0],
                'performance': random.choices(performance_tiers, weights=performance_weights)[0],
                'volatility': random.choices(volatility_levels, weights=volatility_weights)[0],
                'price_sensitivity': random.uniform(0.7, 1.3),  # How much price affects sales
                'seasonal_factor': random.uniform(0.8, 1.2),   # Base seasonal multiplier
                'weekend_preference': random.uniform(0.6, 1.8), # Weekend vs weekday preference
                'special_events': special_events,
                'trend_direction': random.choice(['up', 'down', 'stable', 'volatile']),
                'brand_loyalty': random.uniform(0.3, 0.9),     # Affects discount sensitivity
                'viral_potential': random.uniform(0.1, 0.9),   # Chance of viral sales spikes
            }

    def generate_special_events(self, start_date, end_date):
        """Generate random special events for products"""
        events = []
        total_days = (end_date - start_date).days
        
        # 30% chance of having 1-3 special events
        if random.random() < 0.3:
            num_events = random.randint(1, 3)
            for _ in range(num_events):
                event_date = start_date + timedelta(days=random.randint(0, total_days))
                event_type = random.choice([
                    'flash_sale', 'viral_trend', 'influencer_mention', 
                    'competitor_issue', 'supply_shortage', 'media_feature'
                ])
                duration = random.randint(1, 7)  # 1-7 days
                intensity = random.uniform(1.2, 3.0)  # Sales multiplier
                
                events.append({
                    'date': event_date,
                    'type': event_type,
                    'duration': duration,
                    'intensity': intensity
                })
        
        return events

    def generate_daily_sales(self, sale_date, products):
        """Generate realistic daily sales with product diversity"""
        daily_sales_count = 0
        
        for product in products:
            # Get product profile
            profile = self.product_profiles[product.product_id]
            
            # Calculate complex daily sales probability
            sales_data = self.calculate_advanced_daily_sales(product, sale_date, profile)
            
            # Some products might not sell every day
            if random.random() < sales_data['probability']:
                num_transactions = random.randint(1, sales_data['max_transactions'])
                
                for _ in range(num_transactions):
                    quantity = random.randint(1, sales_data['max_quantity_per_transaction'])
                    
                    # Check if we have enough stock
                    if product.current_stock >= quantity:
                        # Create the sale
                        self.create_sale_record(product, sale_date, quantity, profile)
                        daily_sales_count += 1
                        
                        # Update stock
                        product.current_stock -= quantity
                        product.save()
        
        return daily_sales_count

    def calculate_advanced_daily_sales(self, product, sale_date, profile):
        """Calculate realistic daily sales with advanced product profiling"""
        category_name = product.category.name if product.category else 'Unknown'
        
        # Base category patterns (more conservative)
        category_patterns = {
            'Groceries': {
                'base_probability': 0.85,
                'base_max_transactions': 8,
                'base_max_quantity': 12,
            },
            'Electronics': {
                'base_probability': 0.45,
                'base_max_transactions': 3,
                'base_max_quantity': 3,
            },
            'Clothing': {
                'base_probability': 0.60,
                'base_max_transactions': 5,
                'base_max_quantity': 4,
            },
            'Furniture': {
                'base_probability': 0.25,
                'base_max_transactions': 2,
                'base_max_quantity': 2,
            },
            'Toys': {
                'base_probability': 0.55,
                'base_max_transactions': 4,
                'base_max_quantity': 5,
            }
        }
        
        pattern = category_patterns.get(category_name, category_patterns['Groceries'])
        
        # 1. Lifecycle stage multiplier
        lifecycle_multipliers = {
            'New': random.uniform(0.3, 0.8),      # New products start slow
            'Growing': random.uniform(0.8, 1.5),   # Growing products vary
            'Mature': random.uniform(0.7, 1.1),    # Stable mature products
            'Declining': random.uniform(0.4, 0.8)  # Declining products fade
        }
        lifecycle_factor = lifecycle_multipliers[profile['lifecycle']]
        
        # 2. Performance tier multiplier
        performance_multipliers = {
            'Poor': random.uniform(0.3, 0.6),
            'Average': random.uniform(0.7, 1.0),
            'Good': random.uniform(1.0, 1.4),
            'Excellent': random.uniform(1.3, 2.0)
        }
        performance_factor = performance_multipliers[profile['performance']]
        
        # 3. Price sensitivity (expensive items affected more)
        price_factor = 1.0
        if product.unit_price > 70:
            price_factor = 0.3 * profile['price_sensitivity']
        elif product.unit_price > 50:
            price_factor = 0.6 * profile['price_sensitivity']
        elif product.unit_price > 30:
            price_factor = 0.8 * profile['price_sensitivity']
        else:
            price_factor = 1.2 * profile['price_sensitivity']
        
        # 4. Day of week factors (category-specific)
        weekday_factors = self.get_category_weekday_factors(category_name, sale_date, profile)
        
        # 5. Seasonal factors (more complex)
        seasonal_factor = self.get_advanced_seasonal_factor(category_name, sale_date, profile)
        
        # 6. Special events
        event_factor = self.get_special_event_factor(sale_date, profile)
        
        # 7. Trend factor (gradual changes over time)
        trend_factor = self.get_trend_factor(sale_date, profile)
        
        # 8. Volatility (random daily variation)
        volatility_multipliers = {
            'Low': random.uniform(0.9, 1.1),
            'Medium': random.uniform(0.7, 1.3),
            'High': random.uniform(0.5, 1.8)
        }
        volatility_factor = volatility_multipliers[profile['volatility']]
        
        # 9. Stock availability factor
        stock_factor = 1.0
        if product.current_stock < 50:
            stock_factor = 0.6
        elif product.current_stock < 20:
            stock_factor = 0.3
        elif product.current_stock > 200:
            stock_factor = 1.1  # High stock = push sales
        
        # Combine all factors
        total_multiplier = (
            lifecycle_factor * 
            performance_factor * 
            price_factor * 
            weekday_factors * 
            seasonal_factor * 
            event_factor * 
            trend_factor * 
            volatility_factor * 
            stock_factor
        )
        
        # Calculate final values
        probability = min(0.95, pattern['base_probability'] * total_multiplier)
        max_transactions = max(1, int(pattern['base_max_transactions'] * total_multiplier))
        max_quantity = max(1, int(pattern['base_max_quantity'] * min(total_multiplier, 2.0)))
        
        return {
            'probability': max(0.01, probability),  # Minimum 1% chance
            'max_transactions': max_transactions,
            'max_quantity_per_transaction': max_quantity
        }

    def get_category_weekday_factors(self, category_name, sale_date, profile):
        """Get weekday factors specific to categories"""
        weekday = sale_date.weekday()  # 0=Monday, 6=Sunday
        
        # Category-specific weekday patterns
        weekday_patterns = {
            'Groceries': [0.9, 0.8, 0.9, 1.0, 1.2, 1.4, 1.3],  # Weekend shopping
            'Electronics': [1.1, 1.0, 1.0, 1.0, 1.1, 1.3, 1.2],  # Slight weekend boost
            'Clothing': [0.8, 0.9, 0.9, 1.0, 1.2, 1.4, 1.2],   # Strong weekend pattern
            'Furniture': [1.0, 1.0, 1.0, 1.0, 1.1, 1.3, 1.4],   # Weekend browsing/buying
            'Toys': [0.9, 0.8, 0.9, 1.0, 1.1, 1.4, 1.3],       # Weekend family time
        }
        
        base_factor = weekday_patterns.get(category_name, [1.0] * 7)[weekday]
        return base_factor * profile['weekend_preference']

    def get_advanced_seasonal_factor(self, category_name, sale_date, profile):
        """Get advanced seasonal factors"""
        month = sale_date.month
        day_of_year = sale_date.timetuple().tm_yday
        
        # Category-specific seasonal patterns
        seasonal_patterns = {
            'Groceries': {
                'base': 1.0,
                'holiday_months': {11: 1.3, 12: 1.5, 1: 0.9},  # Thanksgiving, Christmas, New Year diet
                'summer_boost': 0.1,  # BBQ season
            },
            'Electronics': {
                'base': 1.0,
                'holiday_months': {11: 1.6, 12: 1.8, 1: 0.7},  # Black Friday, Christmas, post-holiday
                'back_to_school': {8: 1.2, 9: 1.1},
            },
            'Clothing': {
                'base': 1.0,
                'seasonal_transitions': {3: 1.2, 4: 1.1, 9: 1.2, 10: 1.1},  # Spring/Fall fashion
                'holiday_months': {11: 1.4, 12: 1.6},
            },
            'Furniture': {
                'base': 1.0,
                'spring_cleaning': {3: 1.2, 4: 1.3, 5: 1.2},
                'moving_season': {6: 1.1, 7: 1.1, 8: 1.1},
            },
            'Toys': {
                'base': 1.0,
                'holiday_months': {11: 1.5, 12: 2.0, 1: 0.6},  # Christmas rush
                'summer_boost': {6: 1.1, 7: 1.2, 8: 1.1},
            }
        }
        
        category_pattern = seasonal_patterns.get(category_name, seasonal_patterns['Groceries'])
        
        # Base seasonal factor
        factor = category_pattern['base']
        
        # Apply month-specific factors
        for pattern_key, pattern_dict in category_pattern.items():
            if isinstance(pattern_dict, dict) and month in pattern_dict:
                factor *= pattern_dict[month]
        
        # Add some randomness based on profile
        factor *= profile['seasonal_factor']
        
        return factor

    def get_special_event_factor(self, sale_date, profile):
        """Check for special events affecting this product"""
        factor = 1.0
        
        for event in profile['special_events']:
            event_start = event['date']
            event_end = event_start + timedelta(days=event['duration'])
            
            if event_start <= sale_date <= event_end:
                # Event is active
                event_factors = {
                    'flash_sale': random.uniform(1.5, 2.5),
                    'viral_trend': random.uniform(2.0, 4.0),
                    'influencer_mention': random.uniform(1.3, 2.0),
                    'competitor_issue': random.uniform(1.2, 1.8),
                    'supply_shortage': random.uniform(0.3, 0.7),  # Negative event
                    'media_feature': random.uniform(1.4, 2.2),
                }
                
                factor *= event_factors.get(event['type'], 1.0)
        
        return factor

    def get_trend_factor(self, sale_date, profile):
        """Apply gradual trends over time"""
        # This could be based on days since product launch, seasonal trends, etc.
        trend_directions = {
            'up': random.uniform(1.0, 1.05),      # Gradually increasing
            'down': random.uniform(0.95, 1.0),    # Gradually decreasing
            'stable': random.uniform(0.98, 1.02), # Mostly stable
            'volatile': random.uniform(0.9, 1.1)  # More variation
        }
        
        return trend_directions[profile['trend_direction']]

    def create_sale_record(self, product, sale_date, quantity, profile):
        """Create a single sales record with product-specific characteristics"""
        # Random time during business hours (with category preferences)
        if product.category.name == 'Groceries':
            # Groceries: Peak at meal times
            hour_weights = [1, 1, 1, 1, 1, 1, 2, 3, 4, 3, 2, 3, 4, 3, 2, 2, 3, 4, 5, 4, 3, 2, 1, 1]
            hour = random.choices(range(24), weights=hour_weights)[0]
        elif product.category.name == 'Electronics':
            # Electronics: Peak in evening
            hour_weights = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 4, 5, 5, 4, 3, 2, 1]
            hour = random.choices(range(24), weights=hour_weights)[0]
        else:
            # Other categories: Normal business hours
            hour = random.randint(9, 21)
        
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        transaction_datetime = datetime.combine(sale_date, time(hour, minute, second))
        
        # Price variations based on product profile
        if profile['performance'] == 'Excellent':
            price_variation = random.uniform(1.0, 1.1)  # Premium pricing
        elif profile['performance'] == 'Poor':
            price_variation = random.uniform(0.9, 1.0)  # Discounted pricing
        else:
            price_variation = random.uniform(0.95, 1.05)  # Normal variation
        
        sale_price = round(product.unit_price * price_variation, 2)
        
        # Discount logic based on brand loyalty and lifecycle
        discount = 0.0
        promotion = False
        
        # Base discount probability
        discount_probability = 0.15
        
        # Adjust discount probability based on product characteristics
        if profile['lifecycle'] == 'Declining':
            discount_probability = 0.35  # More discounts for declining products
        elif profile['lifecycle'] == 'New':
            discount_probability = 0.25  # Launch promotions
        elif profile['performance'] == 'Poor':
            discount_probability = 0.40  # Struggling products need discounts
        
        # Brand loyalty affects discount sensitivity
        discount_probability *= (1.0 - profile['brand_loyalty'] * 0.5)
        
        if random.random() < discount_probability:
            if profile['lifecycle'] == 'Declining':
                discount = round(random.uniform(0.15, 0.40) * sale_price, 2)  # Deeper discounts
            else:
                discount = round(random.uniform(0.05, 0.25) * sale_price, 2)
            promotion = True
        
        # Weekend promotions (category-specific)
        if sale_date.weekday() >= 5:  # Weekend
            weekend_promo_chance = {
                'Groceries': 0.20,
                'Electronics': 0.30,
                'Clothing': 0.35,
                'Furniture': 0.25,
                'Toys': 0.30,
            }.get(product.category.name, 0.25)
            
            if random.random() < weekend_promo_chance:
                discount = max(discount, round(random.uniform(0.10, 0.30) * sale_price, 2))
                promotion = True
        
        SalesRecords.objects.create(
            transaction_date=transaction_datetime,
            product=product,
            quantity_sold=quantity,
            unit_price_at_sale=sale_price,
            discount_applied=discount,
            promotion_marker=promotion
        )
