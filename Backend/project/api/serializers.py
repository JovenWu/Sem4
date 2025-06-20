from rest_framework import serializers
from .models import *

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class SupplierShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['supplier_id', 'name']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class CategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = '__all__'

class ProductsSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        slug_field='name',
        queryset = Categories.objects.all()
    )
    
    class Meta: 
        model = Products
        fields = ['product_id', 'product_name', 'category_id', 'category', 'unit_price', 'current_stock', 'competitor_price']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if hasattr(self, '_forecast_data') and self._forecast_data:
            forecast_info = self._forecast_data.get(instance.product_id)
            if forecast_info:
                pending_orders = PurchaseOrderItems.objects.filter(
                    product=instance,
                    purchase_order__status__in=['Ordered', 'Pending']
                ).aggregate(
                    total_pending=models.Sum('ordered_quantity')
                )['total_pending'] or 0
                
                predicted_units = forecast_info.get('total_predicted_units', 0)
                current_stock = instance.current_stock
                total_available = current_stock
                
                safety_stock_multiplier = 1.2
                overstock_multiplier = 2.0
                
                required_stock = predicted_units * safety_stock_multiplier
                overstock_threshold = predicted_units * overstock_multiplier
                
                if total_available >= overstock_threshold:
                    status = "Overstock"
                elif total_available < required_stock:
                    status = "Understock"
                else:
                    status = "Optimal Stock"
                
                data['stock_status'] = {
                    'status': status,
                    'current_stock': current_stock,
                    'pending_orders': pending_orders,
                    'total_available': total_available,
                    'predicted_sales': predicted_units,
                    'required_stock': round(required_stock, 2),
                    'overstock_threshold': round(overstock_threshold, 2)
                }
        
        return data

class PurchaseOrderItemsSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset = Products.objects.all(),
        source='product'
    )
    class Meta:
        model = PurchaseOrderItems
        exclude = ('purchase_order', 'product')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['product_id'] = instance.product.product_id
        return data

class PurchaseOrdersSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemsSerializer(many=True)
    supplier = SupplierShortSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), source='supplier', write_only=True, required=False
    )
    class Meta:
        model = PurchaseOrders
        fields = [
            'po_id', 'supplier', 'supplier_id', 'order_date',
            'expected_delivery_date', 'status', 'notes',
            'created_at', 'updated_at', 'items'
        ]

    def create(self, validated_data):
        from django.db import transaction

        items_data = validated_data.pop('items', [])
        status = validated_data.get('status', '')
        
        with transaction.atomic():
            po = PurchaseOrders.objects.create(**validated_data)
            for item in items_data:
                product = Products.objects.get(product_id=item['product'].product_id)
                PurchaseOrderItems.objects.create(
                    purchase_order=po,
                    product=product,
                    ordered_quantity=item['ordered_quantity'],
                    unit_cost_price=item['unit_cost_price'],
                )
                
                # Update stock if status is "Received"
                if status.lower() == 'received':
                    product.current_stock += item['ordered_quantity']
                    product.save()
            return po

    def update(self, instance, validated_data):
        from django.db import transaction
        
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        with transaction.atomic():
            # Update the purchase order
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # If status changed from non-received to received, update stock
            if old_status.lower() != 'received' and new_status.lower() == 'received':
                items = PurchaseOrderItems.objects.filter(purchase_order=instance)
                for item in items:
                    product = item.product
                    product.current_stock += item.ordered_quantity
                    product.save()
                    
            return instance

    def to_representation(self, instance):
        """Customize the response format including nested items"""
        data = super().to_representation(instance)
        items = PurchaseOrderItems.objects.filter(purchase_order=instance)
        data['items'] = PurchaseOrderItemsSerializer(items, many=True).data
        return data

class PurchaseOrderListSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemsSerializer(many=True, read_only=True)
    supplier = SupplierShortSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), source='supplier', write_only=True, required=False
    )
    class Meta:
        model = PurchaseOrders
        fields = [
            'po_id', 'supplier', 'supplier_id', 'order_date',
            'expected_delivery_date', 'status', 'notes',
            'created_at', 'updated_at', 'items'
        ]

    def to_representation(self, instance):
        """Customize the response format including nested items"""
        data = super().to_representation(instance)
        items = PurchaseOrderItems.objects.filter(purchase_order=instance)
        data['items'] = PurchaseOrderItemsSerializer(items, many=True).data
        return data

class PurchaseOrderDetailSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemsSerializer(many=True)
    supplier = SupplierShortSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), source='supplier', write_only=True, required=False
    )
    class Meta:
        model = PurchaseOrders
        fields = [
            'po_id', 'supplier', 'supplier_id', 'order_date',
            'expected_delivery_date', 'status', 'notes',
            'created_at', 'updated_at', 'items'
        ]

    def create(self, validated_data):
        from django.db import transaction

        items_data = validated_data.pop('items', [])
        status = validated_data.get('status', '')
        
        with transaction.atomic():
            po = PurchaseOrders.objects.create(**validated_data)
            for item in items_data:
                product = Products.objects.get(product_id=item['product'].product_id)
                PurchaseOrderItems.objects.create(
                    purchase_order=po,
                    product=product,
                    ordered_quantity=item['ordered_quantity'],
                    unit_cost_price=item['unit_cost_price'],
                )
                
                # Update stock if status is "Received"
                if status.lower() == 'received':
                    product.current_stock += item['ordered_quantity']
                    product.save()
            return po

    def update(self, instance, validated_data):
        from django.db import transaction
        
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        with transaction.atomic():
            # Update the purchase order
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # If status changed from non-received to received, update stock
            if old_status.lower() != 'received' and new_status.lower() == 'received':
                items = PurchaseOrderItems.objects.filter(purchase_order=instance)
                for item in items:
                    product = item.product
                    product.current_stock += item.ordered_quantity
                    product.save()
                    
            return instance

    def to_representation(self, instance):
        """Customize the response format including nested items"""
        data = super().to_representation(instance)
        items = PurchaseOrderItems.objects.filter(purchase_order=instance)
        data['items'] = PurchaseOrderItemsSerializer(items, many=True).data
        return data

class SalesRecordsSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset = Products.objects.all(),
        source='product'
    )
    customer = serializers.SerializerMethodField(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True, required=False
    )
    class Meta:
        model = SalesRecords
        exclude = ('product',)

    def get_customer(self, instance):
        if instance.customer:
            return {
                'customer_id': instance.customer.customer_id,
                'name': instance.customer.name
            }
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['product_id'] = instance.product.product_id
        if instance.customer:
            data['customer_id'] = instance.customer.customer_id
        else:
            data['customer_id'] = None
        return data

class DashboardSummarySerializer(serializers.Serializer):
    """Serializer for dashboard summary data including total sales and revenue"""
    total_sales_volume = serializers.IntegerField(read_only=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_discount_given = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    net_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_transactions = serializers.IntegerField(read_only=True)
    average_transaction_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    date_range = serializers.CharField(read_only=True)
    
    # Monthly chart data
    monthly_chart_data = serializers.ListField(read_only=True, required=False)
    # Optional breakdown by period
    daily_averages = serializers.DictField(read_only=True, required=False)
    top_products = serializers.ListField(read_only=True, required=False)
    category_breakdown = serializers.DictField(read_only=True, required=False)