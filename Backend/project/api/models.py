from django.db import models
import uuid

# Create your models here.
class Categories(models.Model):
    category_id = models.CharField(primary_key=True, max_length=50, editable=False, default=uuid.uuid4)
    name = models.CharField(max_length=255, unique=True, null=False, blank=False)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class Products(models.Model):
    product_id = models.CharField(primary_key=True, max_length=50, editable=False, default=uuid.uuid4)
    category = models.ForeignKey(Categories, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', to_field='category_id')
    product_name = models.CharField(max_length=255, null=False, blank=False)
    unit_price = models.FloatField(default=0.0)
    competitor_price = models.FloatField(null=True, blank=True, default=0.0) 
    current_stock = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name

    class Meta:
        verbose_name_plural = "Products"

class Supplier(models.Model):
    supplier_id = models.CharField(primary_key=True, max_length=50, editable=False, default=uuid.uuid4)
    name = models.CharField(max_length=255, unique=True, null=False, blank=False)
    contact_person = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Suppliers"

class Customer(models.Model):
    customer_id = models.CharField(primary_key=True, max_length=50, editable=False, default=uuid.uuid4)
    name = models.CharField(max_length=255, unique=True, null=False, blank=False)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Customers"

class PurchaseOrders(models.Model):
    po_id = models.CharField(primary_key=True, max_length=50, editable=False, default=uuid.uuid4)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders', to_field='supplier_id')
    order_date = models.DateField(null=False, blank=False)
    expected_delivery_date = models.DateField(null=True, blank=True)
    STATUS_CHOICES = [
        ('Ordered', 'Ordered'),
        ('Received', 'Received'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, null=False, blank=False, default='Ordered')
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PO {self.po_id} - {self.supplier.name if self.supplier else 'No Supplier'}"

    class Meta:
        verbose_name_plural = "Purchase Orders"
        ordering = ['-order_date']

class PurchaseOrderItems(models.Model):
    po_item_id = models.CharField(primary_key=True, max_length=50, editable=False, default=uuid.uuid4)
    purchase_order = models.ForeignKey(PurchaseOrders, on_delete=models.CASCADE, related_name='items', to_field='po_id', null=False)
    product = models.ForeignKey(Products, on_delete=models.PROTECT, related_name='purchase_order_items', to_field='product_id', null=False) # PROTECT to prevent deleting product if in PO
    ordered_quantity = models.IntegerField(null=False, blank=False, default=1)
    received_quantity = models.IntegerField(default=0)
    unit_cost_price = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.ordered_quantity} of {self.product.product_name} for PO {self.purchase_order.po_id}"

    class Meta:
        verbose_name_plural = "Purchase Order Items"

class SalesRecords(models.Model):
    sales_record_id = models.CharField(primary_key=True, max_length=50, editable=False, default=uuid.uuid4)
    transaction_date = models.DateTimeField(null=False, blank=False)
    product = models.ForeignKey(Products, on_delete=models.PROTECT, related_name='sales_records', to_field='product_id', null=False)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_records', to_field='customer_id')
    quantity_sold = models.IntegerField(null=False, blank=False, default=1)
    unit_price_at_sale = models.FloatField(null=False, blank=False, default=0.0)
    discount_applied = models.FloatField(default=0.0)
    promotion_marker = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Sale of {self.quantity_sold} x {self.product.product_name} on {self.transaction_date.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name_plural = "Sales Records"
        ordering = ['-transaction_date']