import pandas as pd
from datetime import datetime, timedelta
from django.db.models import Q, Sum
from ..models import Products, SalesRecords, Categories
import os
from pathlib import Path

class DataPreparation:
    def __init__(self):
        self.model_dir = Path(__file__).resolve().parent / 'model_files'
        
    def collect_sales_data(self, start_date=None, end_date=None):
        """
        Collect sales data from Django models and format for ML model
        
        Args:
            start_date: Start date for data collection (YYYY-MM-DD)
            end_date: End date for data collection (YYYY-MM-DD)
            
        Returns:
            pandas.DataFrame: Formatted data ready for ML model
        """
        if not end_date:
            end_date = datetime.now().date()
        if not start_date:
            start_date = end_date - timedelta(days=365)
            
        sales_query = SalesRecords.objects.select_related('product', 'product__category').filter(
            transaction_date__date__gte=start_date,
            transaction_date__date__lte=end_date
        ).order_by('transaction_date')
        data_rows = []
        
        from .multi_model_predictor import MultiModelPredictor
        predictor = MultiModelPredictor()
        unique_products = set(sale.product.product_id for sale in sales_query)
        product_demand_forecasts = {}
        for product_id in unique_products:
            product_demand_forecasts[product_id] = predictor._calculate_simple_moving_average(
                product_id, end_date
            )
        
        for sale in sales_query:
            demand_forecast = product_demand_forecasts.get(sale.product.product_id, 0.0)
            
            row = {
                'Date': sale.transaction_date.date(),
                'Product_ID': sale.product.product_id,
                'Category': sale.product.category.name if sale.product.category else 'Unknown',
                'Inventory_Level': sale.product.current_stock,
                'Competitor_Pricing': sale.product.competitor_price or 0.0,
                'Units_Sold': sale.quantity_sold,
                'Units_Ordered': self._get_units_ordered(sale.product, sale.transaction_date.date()),
                'Price': sale.unit_price_at_sale,
                'Discount': sale.discount_applied,
                'Holiday/Promotion': 1 if sale.promotion_marker else 0,
                'Demand Forecast': demand_forecast,
            }
            data_rows.append(row)
            
        return pd.DataFrame(data_rows)
    
    def _get_units_ordered(self, product, date):
        """
        Get units ordered for a product around a specific date
        This is a simplified approach - you may need to adjust based on your business logic
        """

        from ..models import PurchaseOrderItems
        
        start_date = date - timedelta(days=30)
        end_date = date
        
        po_items = PurchaseOrderItems.objects.filter(
            product=product,
            purchase_order__order_date__gte=start_date,
            purchase_order__order_date__lte=end_date
        )
        
        total_ordered = sum(item.ordered_quantity for item in po_items)
        return total_ordered if total_ordered > 0 else 0
    
    def generate_training_csv(self, start_date=None, end_date=None, filename='processed.csv'):
        """
        Generate CSV file for training the ML model
        
        Args:
            start_date: Start date for data collection (YYYY-MM-DD)
            end_date: End date for data collection (YYYY-MM-DD)
            filename: Name of the output CSV file
            
        Returns:
            str: Path to the generated CSV file
        """
        df = self.collect_sales_data(start_date, end_date)
        
        if df.empty:
            raise ValueError("No sales data found for the specified date range")
        
        os.makedirs(self.model_dir, exist_ok=True)
        
        csv_path = os.path.join(self.model_dir, filename)
        df.to_csv(csv_path, index=False)
        
        print(f"Training data saved to: {csv_path}")
        print(f"Data shape: {df.shape}")
        print(f"Date range: {df['Date'].min()} to {df['Date'].max()}")
        
        return csv_path
    
    def get_latest_product_data(self, product_ids=None):
        """
        Get the latest data for specific products for prediction
        
        Args:
            product_ids: List of product IDs to get data for
            
        Returns:
            pandas.DataFrame: Latest product data
        """
        if product_ids:
            products = Products.objects.select_related('category').filter(product_id__in=product_ids)
        else:
            products = Products.objects.select_related('category').all()
            
        data_rows = []
        current_date = datetime.now().date()
        for product in products:
            latest_sale = SalesRecords.objects.filter(product=product).order_by('-transaction_date').first()
            
            from .multi_model_predictor import MultiModelPredictor
            predictor = MultiModelPredictor()
            demand_forecast = predictor._calculate_simple_moving_average(product.product_id, current_date)
            
            row = {
                'Date': current_date,
                'Product_ID': product.product_id,
                'Category': product.category.name if product.category else 'Unknown',
                'Inventory_Level': product.current_stock,
                'Competitor_Pricing': product.competitor_price or 0.0,
                'Units_Sold': latest_sale.quantity_sold if latest_sale else 0,
                'Units_Ordered': self._get_units_ordered(product, current_date),
                'Price': product.unit_price,
                'Discount': latest_sale.discount_applied if latest_sale else 0.0,
                'Holiday/Promotion': 1 if (latest_sale and latest_sale.promotion_marker) else 0,
                'Demand Forecast': demand_forecast,
            }
            data_rows.append(row)
            
        return pd.DataFrame(data_rows)

def generate_training_data(start_date=None, end_date=None, filename='processed.csv'):
    """
    Convenience function to generate training CSV data
    
    Args:
        start_date: Start date for data collection (YYYY-MM-DD string or datetime)
        end_date: End date for data collection (YYYY-MM-DD string or datetime)
        filename: Name of the output CSV file
        
    Returns:
        str: Path to the generated CSV file
    """
    data_prep = DataPreparation()
    return data_prep.generate_training_csv(start_date, end_date, filename)

def get_current_product_data(product_ids=None):
    """
    Convenience function to get current product data for prediction
    
    Args:
        product_ids: List of product IDs to get data for
        
    Returns:
        pandas.DataFrame: Current product data
    """
    data_prep = DataPreparation()
    return data_prep.get_latest_product_data(product_ids)
