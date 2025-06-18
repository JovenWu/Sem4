from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'categories', CategoriesViewSet)
router.register(r'products', ProductsViewSet)
router.register(r'purchase-order', PurchaseOrdersViewSet)
router.register(r'sales-records', SalesRecordsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('generate-ml-data/', generate_ml_training_data, name='generate-ml-data'),
    path('product-data-preview/', get_product_data_preview, name='product-data-preview'),
    path('test-ml-models/', test_ml_models, name='test-ml-models'),
    path('dashboard-summary/', dashboard_summary, name='dashboard-summary'),
]