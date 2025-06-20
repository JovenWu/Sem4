from datetime import datetime, timedelta
from django.db.models import Sum, Count, F, ExpressionWrapper, FloatField, Case, When, Q, CharField
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.utils import timezone
from .models import Products, SalesRecordItem, SalesTransaction, PurchaseOrders, PurchaseOrderItems


def get_sales_report(start_date=None, end_date=None, period='daily'):
    """
    Generate sales reports for different time periods.
    
    Parameters:
    - start_date: Optional start date for filtering data
    - end_date: Optional end date for filtering data
    - period: 'daily', 'weekly', or 'monthly'
    
    Returns a dict with sales report data.
    """
    if not start_date:
        start_date = timezone.now() - timedelta(days=30)  # Default to last 30 days
    if not end_date:
        end_date = timezone.now()
        
    # Convert string dates to datetime if needed
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        
    # Base query for sales transactions within the date range
    transactions = SalesTransaction.objects.filter(
        transaction_date__gte=start_date,
        transaction_date__lte=end_date
    )
    
    # Define the period truncation function based on selected period
    if period == 'daily':
        trunc_func = TruncDay
        date_format = '%Y-%m-%d'
    elif period == 'weekly':
        trunc_func = TruncWeek
        date_format = 'Week of %Y-%m-%d'
    elif period == 'monthly':
        trunc_func = TruncMonth
        date_format = '%Y-%m'
    else:
        trunc_func = TruncDay  # Default to daily
        date_format = '%Y-%m-%d'
    
    # Get sales data grouped by period
    sales_by_period = SalesRecordItem.objects.filter(
        transaction__in=transactions
    ).annotate(
        period=trunc_func('transaction__transaction_date')
    ).values(
        'period'
    ).annotate(
        total_sales=Sum(F('quantity_sold') * F('unit_price_at_sale')),
        total_items=Sum('quantity_sold'),
        order_count=Count('transaction', distinct=True)
    ).order_by('period')
    
    # Format the data for response
    result = {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'period': period,
        'sales_data': [
            {
                'date': item['period'].strftime(date_format) if item['period'] else 'Unknown',
                'total_sales': round(float(item['total_sales']), 2) if item['total_sales'] else 0,
                'total_items': item['total_items'] or 0,
                'order_count': item['order_count'] or 0,
                'average_order_value': round(float(item['total_sales'] / item['order_count']), 2) if item['order_count'] and item['total_sales'] else 0
            } for item in sales_by_period
        ],
    }
    
    # Calculate summary stats
    total_sales = sum(item['total_sales'] for item in result['sales_data'])
    total_orders = sum(item['order_count'] for item in result['sales_data'])
    
    result['summary'] = {
        'total_sales': round(total_sales, 2),
        'total_orders': total_orders,
        'average_order_value': round(total_sales / total_orders, 2) if total_orders else 0
    }
    
    return result


def get_top_selling_products(start_date=None, end_date=None, limit=10):
    """
    Get top-selling products within a date range.
    
    Parameters:
    - start_date: Optional start date for filtering data
    - end_date: Optional end date for filtering data
    - limit: Number of top products to return
    
    Returns a list of top selling products with their sales data.
    """
    if not start_date:
        start_date = timezone.now() - timedelta(days=30)  # Default to last 30 days
    if not end_date:
        end_date = timezone.now()
        
    # Convert string dates to datetime if needed
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
    
    top_products = SalesRecordItem.objects.filter(
        transaction__transaction_date__gte=start_date,
        transaction__transaction_date__lte=end_date
    ).values(
        'product__product_id', 
        'product__product_name'
    ).annotate(
        total_quantity=Sum('quantity_sold'),
        total_revenue=Sum(F('quantity_sold') * F('unit_price_at_sale')),
        total_orders=Count('transaction', distinct=True)
    ).order_by('-total_revenue')[:limit]
    
    return {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'top_products': list(top_products)
    }


def get_inventory_report():
    """
    Generate inventory status report including stock levels and valuation.
    
    Returns a dict with inventory data.
    """
    # Get all products with their current stock and value
    products = Products.objects.all().annotate(
        stock_value=ExpressionWrapper(
            F('current_stock') * F('unit_price'),
            output_field=FloatField()
        ),
        stock_status=Case(
            When(current_stock=0, then='Out of Stock'),
            When(current_stock__lte=5, then='Low Stock'),
            default='In Stock',            output_field=CharField()
        )
    ).values(
        'product_id',
        'product_name',
        'category__name',
        'current_stock',
        'unit_price',
        'stock_value',
        'stock_status'
    )
    
    # Calculate inventory summary
    total_products = len(products)
    total_items = sum(p['current_stock'] for p in products)
    total_value = sum(p['stock_value'] for p in products)
    
    # Count products by stock status
    out_of_stock = sum(1 for p in products if p['stock_status'] == 'Out of Stock')
    low_stock = sum(1 for p in products if p['stock_status'] == 'Low Stock')
    in_stock = sum(1 for p in products if p['stock_status'] == 'In Stock')
    
    return {
        'products': list(products),
        'summary': {
            'total_products': total_products,
            'total_items': total_items,
            'total_value': round(total_value, 2),
            'stock_status': {
                'out_of_stock': out_of_stock,
                'low_stock': low_stock,
                'in_stock': in_stock,
                'out_of_stock_percent': round((out_of_stock / total_products) * 100, 2) if total_products else 0,
                'low_stock_percent': round((low_stock / total_products) * 100, 2) if total_products else 0,
                'in_stock_percent': round((in_stock / total_products) * 100, 2) if total_products else 0
            }
        }
    }


def get_inventory_movement_report(start_date=None, end_date=None):
    """
    Generate inventory movement report showing inflows and outflows.
    
    Parameters:
    - start_date: Optional start date for filtering data
    - end_date: Optional end date for filtering data
    
    Returns a dict with inventory movement data.
    """
    if not start_date:
        start_date = timezone.now() - timedelta(days=30)  # Default to last 30 days
    if not end_date:
        end_date = timezone.now()
        
    # Convert string dates to datetime if needed
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
    
    # Get inflows (purchases received)
    inflows = PurchaseOrderItems.objects.filter(
        purchase_order__order_date__gte=start_date,
        purchase_order__order_date__lte=end_date,
        purchase_order__status='Received'
    ).values(
        'product__product_id',
        'product__product_name'
    ).annotate(
        quantity_in=Sum('received_quantity'),
        cost_value=Sum(F('received_quantity') * F('unit_cost_price'))
    )
    
    # Get outflows (sales)
    outflows = SalesRecordItem.objects.filter(
        transaction__transaction_date__gte=start_date,
        transaction__transaction_date__lte=end_date
    ).values(
        'product__product_id',
        'product__product_name'
    ).annotate(
        quantity_out=Sum('quantity_sold'),
        sales_value=Sum(F('quantity_sold') * F('unit_price_at_sale'))
    )
    
    # Combine the data (need a function to merge by product)
    product_map = {}
    
    for inflow in inflows:
        pid = inflow['product__product_id']
        product_map[pid] = {
            'product_id': pid,
            'product_name': inflow['product__product_name'],
            'quantity_in': inflow['quantity_in'] or 0,
            'cost_value': round(float(inflow['cost_value']), 2) if inflow['cost_value'] else 0,
            'quantity_out': 0,
            'sales_value': 0
        }
    
    for outflow in outflows:
        pid = outflow['product__product_id']
        if pid in product_map:
            product_map[pid]['quantity_out'] = outflow['quantity_out'] or 0
            product_map[pid]['sales_value'] = round(float(outflow['sales_value']), 2) if outflow['sales_value'] else 0
        else:
            product_map[pid] = {
                'product_id': pid,
                'product_name': outflow['product__product_name'],
                'quantity_in': 0,
                'cost_value': 0,
                'quantity_out': outflow['quantity_out'] or 0,
                'sales_value': round(float(outflow['sales_value']), 2) if outflow['sales_value'] else 0
            }
    
    # Calculate net movement
    for product in product_map.values():
        product['net_quantity'] = product['quantity_in'] - product['quantity_out']
    
    return {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'movements': list(product_map.values())
    }
