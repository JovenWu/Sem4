from django.utils.deprecation import MiddlewareMixin
from django.views.decorators.csrf import csrf_exempt
import re


class DisableCSRFForAPIMiddleware(MiddlewareMixin):
    """
    Disable CSRF protection for API endpoints
    """
    def process_request(self, request):
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
