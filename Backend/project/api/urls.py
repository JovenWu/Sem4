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
    path('dashboard-summary/', dashboard_summary, name='dashboard-summary'),
    path('create-user/', CreateUserView.as_view(), name='create-user'),
    path('user-info/', UserInfoView.as_view(), name='user-info'),
    path('employees/', EmployeeListView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
]