from .models import PaymentAuditLog
from django.utils.deprecation import MiddlewareMixin

class PaymentAuditMiddleware(MiddlewareMixin):
    # this attaches ip address nad user agent to the req obj
    def process_request(self, request):
        request.ip_address = self.get_client_ip(request)
        request.user_agent = request.META.get('HTTP_USER_AGENT', '')

    #this would get the client ip
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')