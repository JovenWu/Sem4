from .models import *
from .serializers import *
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.shortcuts import get_object_or_404
from .ml_models import get_product_sales_prediction
from .ml_models.data_preparation import generate_training_data, get_current_product_data
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
import django_filters
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncMonth, Extract
from django.utils import timezone
from django.core.cache import cache
from datetime import datetime, timedelta, date
import hashlib
import hashlib
import calendar

# Custom Pagination Classes
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.page_size,
            'results': data
        })

# Custom Filter Backend to disable HTML rendering
class DjangoFilterBackendNoHTML(DjangoFilterBackend):
    def to_html(self, request, queryset, view):
        # Return empty string to disable HTML form rendering
        return ""

# Custom Filter Classes
class ProductFilter(django_filters.FilterSet):
    product_name = django_filters.CharFilter(lookup_expr='icontains')
    name = django_filters.CharFilter(field_name='product_name', lookup_expr='icontains')  # Alias for backward compatibility
    price_min = django_filters.NumberFilter(field_name='unit_price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='unit_price', lookup_expr='lte')
    stock_min = django_filters.NumberFilter(field_name='current_stock', lookup_expr='gte')
    stock_max = django_filters.NumberFilter(field_name='current_stock', lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__category_id')
    category_name = django_filters.CharFilter(field_name='category__name', lookup_expr='icontains')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    
    class Meta:
        model = Products
        fields = ['product_name', 'name', 'price_min', 'price_max', 'stock_min', 'stock_max', 'category', 'category_name', 'in_stock']
    
    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(current_stock__gt=0)
        return queryset.filter(current_stock=0)

@method_decorator(csrf_exempt, name='dispatch')
class CategoriesViewSet(viewsets.ModelViewSet):
    queryset = Categories.objects.all()
    serializer_class = CategoriesSerializer
    lookup_field = 'category_id'
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackendNoHTML, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'category_id']
    ordering = ['name']

@method_decorator(csrf_exempt, name='dispatch')
class ProductsViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.select_related('category').all()
    serializer_class = ProductsSerializer
    lookup_field = 'product_id'
    allowed_methods = ['GET']
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackendNoHTML, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['product_name', 'category__name']
    ordering_fields = ['product_name', 'unit_price', 'current_stock', 'product_id'
]
    ordering = ['product_name']
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by category if provided (backward compatibility)
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category__category_id=category_id)
            
        return qs
        
    def list(self, request, *args, **kwargs):
        # Check if forecast is requested
        forecast = request.query_params.get('forecast', '').lower() == 'true'
        
        if not forecast:
            # Standard paginated list behavior
            return super().list(request, *args, **kwargs)
        
        # For forecast requests, disable pagination to maintain existing behavior
        self.pagination_class = None
        
        # Get forecast parameters
        try:
            # Get time horizon - daily, weekly or monthly
            time_horizon = request.query_params.get('model', 'daily').lower()
            if time_horizon not in ['daily', 'weekly', 'monthly']:
                return Response(
                    {"error": "Model must be either 'daily', 'weekly', or 'monthly'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get number of periods (days, weeks, months)
            default_periods = {
                'daily': 7,
                'weekly': 4,
                'monthly': 3
            }
            periods = int(request.query_params.get('periods', default_periods.get(time_horizon, 7)))
            if periods < 1 or periods > 90:  # Allow more generous upper limit
                return Response(
                    {"error": f"Periods must be between 1 and 90 for {time_horizon} forecasts"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # For backward compatibility with the 'days' parameter
            if 'days' in request.query_params:
                days = int(request.query_params.get('days'))
                if days > 0:
                    if time_horizon == 'daily':
                        periods = days
                    elif time_horizon == 'weekly':
                        periods = (days + 6) // 7  # Round up to nearest week
                    else:
                        periods = (days + 29) // 30  # Round up to nearest month
                        
        except ValueError:
            return Response(
                {"error": "Periods parameter must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get last date parameter
        last_date = request.query_params.get('last_date', None)
        
        # Get queryset (may be filtered by category)
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get product IDs from queryset
        if 'id' in request.query_params:
            # If specific product ID is provided in URL
            product_ids = [request.query_params['id']]
        else:
            # Otherwise forecast all products in queryset
            product_ids = list(queryset.values_list('product_id', flat=True))
        
        if not product_ids:
            return Response(
                {"error": "No products found to forecast"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get predictions
        try:
            forecast_results = get_product_sales_prediction(
                product_ids=product_ids,
                time_horizon=time_horizon,
                periods=periods,
                last_date=last_date
            )
            
            if isinstance(forecast_results, dict) and "error" in forecast_results:
                return Response(
                    forecast_results,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Get product details and add forecast data
            product_data = []
            
            # Create a mapping of forecast data for the serializer
            forecast_mapping = {}
            for forecast in forecast_results:
                forecast_mapping[forecast['Product_ID']] = {
                    'total_predicted_units': forecast['Total_Predicted_Units_Sold'],
                    'forecast_days': forecast['Actual_Forecast_Days']
                }
            
            for product in queryset:
                # Find matching forecast for this product
                product_forecast = next(
                    (f for f in forecast_results if f['Product_ID'] == product.product_id), 
                    None
                )
                
                # Serialize product with forecast data available
                serializer = self.get_serializer(product)
                serializer._forecast_data = forecast_mapping  # Pass forecast data to serializer
                product_serialized = serializer.data
                
                # Add forecast data if available
                if product_forecast:
                    product_serialized['forecast'] = {
                        'total_predicted_units': product_forecast['Total_Predicted_Units_Sold'],
                        'forecast_days': product_forecast['Actual_Forecast_Days'],
                    }
                else:
                    product_serialized['forecast'] = None
                    
                product_data.append(product_serialized)            
            return Response(product_data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def retrieve(self, request, *args, **kwargs):
        # Check if forecast is requested
        forecast = request.query_params.get('forecast', '').lower() == 'true'
        
        if not forecast:
            # Standard retrieve behavior
            return super().retrieve(request, *args, **kwargs)
        
        # Get the product instance
        instance = self.get_object()
          # Get forecast parameters
        try:
            # Get time horizon - daily, weekly or monthly
            time_horizon = request.query_params.get('model', 'daily').lower()
            if time_horizon not in ['daily', 'weekly', 'monthly']:
                return Response(
                    {"error": "Model must be either 'daily', 'weekly', or 'monthly'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get number of periods (days, weeks, months)
            default_periods = {
                'daily': 7,
                'weekly': 4,
                'monthly': 3
            }
            periods = int(request.query_params.get('periods', default_periods.get(time_horizon, 7)))
            
            # Set appropriate limits based on time horizon
            max_periods = {
                'daily': 30,
                'weekly': 12,
                'monthly': 6
            }
            if periods < 1 or periods > max_periods.get(time_horizon, 30):
                return Response(
                    {"error": f"Periods must be between 1 and {max_periods.get(time_horizon, 30)} for {time_horizon} forecasts"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # For backward compatibility
            if 'days' in request.query_params:
                days = int(request.query_params.get('days'))
                if days > 0:
                    if time_horizon == 'daily':
                        periods = days
                    elif time_horizon == 'weekly':
                        periods = (days + 6) // 7  # Round up to nearest week
                    else:
                        periods = (days + 29) // 30  # Round up to nearest month
        except ValueError:
            return Response(
                {"error": "Periods parameter must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        last_date = request.query_params.get('last_date', None)
        
        # Get prediction for this product
        try:
            forecast_results = get_product_sales_prediction(
                product_ids=[instance.product_id],
                time_horizon=time_horizon,
                periods=periods,
                last_date=last_date
            )
            
            if isinstance(forecast_results, dict) and "error" in forecast_results:
                return Response(
                    forecast_results,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Serialize product
            serializer = self.get_serializer(instance)
            
            # Add forecast data for stock status calculation
            if forecast_results and len(forecast_results) > 0:
                forecast_mapping = {
                    instance.product_id: {
                        'total_predicted_units': forecast_results[0]['Total_Predicted_Units_Sold'],
                        'forecast_days': forecast_results[0]['Actual_Forecast_Days']
                    }
                }
                serializer._forecast_data = forecast_mapping
            
            product_serialized = serializer.data
            
            # Add forecast data
            if forecast_results and len(forecast_results) > 0:
                product_serialized['forecast'] = {
                    'total_predicted_units': forecast_results[0]['Total_Predicted_Units_Sold'],
                    'forecast_days': forecast_results[0]['Actual_Forecast_Days'],
                }
            else:
                product_serialized['forecast'] = None
                
            return Response(product_serialized)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class PurchaseOrdersViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrders.objects.all()
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackendNoHTML, SearchFilter, OrderingFilter]
    search_fields = ['supplier_name', 'notes']
    ordering_fields = ['order_date', 'total_amount', 'status']
    ordering = ['-order_date']

    def get_queryset(self):
        qs = super().get_queryset()
        # Backward compatibility filtering
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        return qs
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseOrderListSerializer
        return PurchaseOrderDetailSerializer
    
@method_decorator(csrf_exempt, name='dispatch')
class SalesRecordsViewSet(viewsets.ModelViewSet):
    queryset = SalesRecords.objects.select_related('product', 'product__category').all()
    serializer_class = SalesRecordsSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackendNoHTML, SearchFilter, OrderingFilter]
    search_fields = ['product__product_name', 'product__product_id']
    ordering_fields = ['transaction_date', 'quantity_sold', 'unit_price_at_sale']
    ordering = ['-transaction_date']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product']
        quantity_sold = serializer.validated_data['quantity_sold']

        with transaction.atomic():
            product.refresh_from_db()
            current_stock = product.current_stock

            if current_stock < quantity_sold:
                return Response({'error': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)

            # Create SalesRecord
            sales_record = SalesRecords.objects.create(
                transaction_date=serializer.validated_data['transaction_date'],
                product=product,
                quantity_sold=quantity_sold,
                unit_price_at_sale=serializer.validated_data['unit_price_at_sale'],
                discount_applied=serializer.validated_data.get('discount_applied', 0),
                promotion_marker=serializer.validated_data.get('promotion_marker', False),
                # inventory_snapshot_before_sale=current_stock,
            )

            # Decrement stock
            product.current_stock = current_stock - quantity_sold
            product.save()

            # Return response
            output_serializer = self.get_serializer(sales_record)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def generate_ml_training_data(request):
    """
    Generate training data CSV for ML model
    
    Parameters:
    - start_date (optional): Start date in YYYY-MM-DD format
    - end_date (optional): End date in YYYY-MM-DD format
    - filename (optional): Custom filename for the CSV
    """
    try:
        start_date = request.data.get('start_date', None)
        end_date = request.data.get('end_date', None)
        filename = request.data.get('filename', 'processed.csv')
        
        csv_path = generate_training_data(start_date, end_date, filename)
        
        return Response({
            'success': True,
            'message': 'Training data generated successfully',
            'csv_path': csv_path
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_product_data_preview(request):
    """
    Get a preview of current product data for ML model
    
    Parameters:
    - product_ids (optional): Comma-separated list of product IDs
    """
    try:
        product_ids_param = request.query_params.get('product_ids', None)
        product_ids = None
        
        if product_ids_param:
            product_ids = [pid.strip() for pid in product_ids_param.split(',')]
        
        df = get_current_product_data(product_ids)
        
        return Response({
            'success': True,
            'data': df.to_dict(orient='records'),
            'shape': df.shape,
            'columns': list(df.columns)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def test_ml_models(request):
    """
    Test the prediction models for all three time horizons
    
    Parameters:
    - product_id: Product ID to test predictions
    - model_type (optional): 'daily', 'weekly', or 'monthly', defaults to testing all
    """
    try:
        product_id = request.query_params.get('product_id')
        model_type = request.query_params.get('model_type', None)
        
        if not product_id:
            return Response({
                'success': False,
                'error': 'Product ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        models_to_test = ['daily', 'weekly', 'monthly']
        if model_type and model_type.lower() in models_to_test:
            models_to_test = [model_type.lower()]
        
        results = {}
        
        for horizon in models_to_test:
            # Set default periods based on model type
            default_periods = {
                'daily': 7,
                'weekly': 4, 
                'monthly': 3
            }
            periods = default_periods.get(horizon)
            
            try:
                forecast_results = get_product_sales_prediction(
                    product_ids=[product_id],
                    time_horizon=horizon,
                    periods=periods
                )
                
                results[horizon] = {
                    'success': True,
                    'periods': periods,
                    'forecasts': forecast_results
                }
            except Exception as e:
                results[horizon] = {
                    'success': False,
                    'error': str(e)
                }
        
        return Response({
            'success': True,
            'results': results
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def dashboard_summary(request):
    """
    Get dashboard summary data efficiently using database aggregation and caching
    
    Query Parameters:
    - year: YYYY (optional, defaults to current year)
    - include_breakdown: true/false (optional, includes detailed breakdowns)
    - include_monthly_chart: true/false (optional, includes monthly chart data)
    """
    
    # Parse parameters
    year = request.GET.get('year')
    include_breakdown = request.GET.get('include_breakdown', 'false').lower() == 'true'
    include_monthly_chart = request.GET.get('include_monthly_chart', 'true').lower() == 'true'
    
    # Set default year
    if not year:
        year = timezone.now().year
    else:
        try:
            year = int(year)
        except ValueError:
            return Response({'error': 'Invalid year format. Use YYYY'}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate date range for the year
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)
    
    # Create cache key based on parameters
    cache_key = f"dashboard_summary_year_{year}_{include_breakdown}_{include_monthly_chart}"
    cache_key = hashlib.md5(cache_key.encode()).hexdigest()
    
    # Try to get from cache first (cache for 10 minutes for yearly data)
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    try:
        # Single query to get all main metrics for the year
        sales_aggregation = SalesRecords.objects.filter(
            transaction_date__date__gte=start_date,
            transaction_date__date__lte=end_date
        ).aggregate(
            total_sales_volume=Sum('quantity_sold'),
            total_revenue=Sum(F('quantity_sold') * F('unit_price_at_sale')),
            total_discount_given=Sum('discount_applied'),
            total_transactions=Count('sales_record_id'),
            average_transaction_value=Avg(F('quantity_sold') * F('unit_price_at_sale'))
        )
        
        # Handle None values from aggregation
        total_sales_volume = sales_aggregation['total_sales_volume'] or 0
        total_revenue = float(sales_aggregation['total_revenue'] or 0)
        total_discount_given = float(sales_aggregation['total_discount_given'] or 0)
        total_transactions = sales_aggregation['total_transactions'] or 0
        average_transaction_value = float(sales_aggregation['average_transaction_value'] or 0)
        
        # Calculate net revenue
        net_revenue = total_revenue - total_discount_given
        
        # Prepare base response data
        summary_data = {
            'total_sales_volume': total_sales_volume,
            'total_revenue': round(total_revenue, 2),
            'total_discount_given': round(total_discount_given, 2),
            'net_revenue': round(net_revenue, 2),
            'total_transactions': total_transactions,
            'average_transaction_value': round(average_transaction_value, 2),
            'date_range': f"{start_date} to {end_date}",
            'year': year
        }
        
        # Add monthly chart data
        if include_monthly_chart:
            monthly_data = SalesRecords.objects.filter(
                transaction_date__date__gte=start_date,
                transaction_date__date__lte=end_date
            ).annotate(
                month=Extract('transaction_date', 'month')
            ).values('month').annotate(
                monthly_revenue=Sum(F('quantity_sold') * F('unit_price_at_sale')),
                monthly_sales_volume=Sum('quantity_sold'),
                monthly_transactions=Count('sales_record_id'),
                monthly_discount=Sum('discount_applied')
            ).order_by('month')
            
            # Create complete 12-month data (fill missing months with zeros)
            monthly_chart_data = []
            monthly_dict = {item['month']: item for item in monthly_data}
            
            for month_num in range(1, 13):
                month_data = monthly_dict.get(month_num, {
                    'monthly_revenue': 0,
                    'monthly_sales_volume': 0,
                    'monthly_transactions': 0,
                    'monthly_discount': 0
                })
                
                monthly_chart_data.append({
                    'month': month_num,
                    'month_name': calendar.month_name[month_num],
                    'month_abbr': calendar.month_abbr[month_num],
                    'revenue': round(float(month_data['monthly_revenue'] or 0), 2),
                    'sales_volume': month_data['monthly_sales_volume'] or 0,
                    'transactions': month_data['monthly_transactions'] or 0,
                    'discount_given': round(float(month_data['monthly_discount'] or 0), 2),
                    'net_revenue': round(float(month_data['monthly_revenue'] or 0) - float(month_data['monthly_discount'] or 0), 2)
                })
            
            summary_data['monthly_chart_data'] = monthly_chart_data
        
        # Add detailed breakdowns if requested
        if include_breakdown:
            # Top 10 products by revenue for the year
            top_products = SalesRecords.objects.filter(
                transaction_date__date__gte=start_date,
                transaction_date__date__lte=end_date
            ).values(
                'product__product_id',
                'product__product_name'
            ).annotate(
                product_revenue=Sum(F('quantity_sold') * F('unit_price_at_sale')),
                product_sales_volume=Sum('quantity_sold'),
                product_transactions=Count('sales_record_id')
            ).order_by('-product_revenue')[:10]
            
            summary_data['top_products'] = [
                {
                    'product_id': item['product__product_id'],
                    'product_name': item['product__product_name'],
                    'revenue': round(float(item['product_revenue']), 2),
                    'sales_volume': item['product_sales_volume'],
                    'transactions': item['product_transactions']
                }
                for item in top_products
            ]
            
            # Category breakdown for the year
            category_breakdown = SalesRecords.objects.filter(
                transaction_date__date__gte=start_date,
                transaction_date__date__lte=end_date
            ).values(
                'product__category__name'
            ).annotate(
                category_revenue=Sum(F('quantity_sold') * F('unit_price_at_sale')),
                category_sales_volume=Sum('quantity_sold'),
                category_transactions=Count('sales_record_id')
            ).order_by('-category_revenue')
            
            summary_data['category_breakdown'] = {
                item['product__category__name'] or 'Uncategorized': {
                    'revenue': round(float(item['category_revenue']), 2),
                    'sales_volume': item['category_sales_volume'],
                    'transactions': item['category_transactions']
                }
                for item in category_breakdown
            }
            
            # Monthly averages for the year
            months_in_year = 12
            summary_data['monthly_averages'] = {
                'avg_monthly_revenue': round(total_revenue / months_in_year, 2),
                'avg_monthly_sales_volume': round(total_sales_volume / months_in_year, 2),
                'avg_monthly_transactions': round(total_transactions / months_in_year, 2)
            }
        
        # Cache the result for 10 minutes (yearly data changes less frequently)
        cache.set(cache_key, summary_data, 600)
        
        return Response(summary_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch dashboard summary: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )