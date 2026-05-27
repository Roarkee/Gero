from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK,HTTP_400_BAD_REQUEST
from .invoice.selectors import InvoiceSelector
from invoices.models import Invoice
# Create your views here.


class InvoiceIntelligence(APIView):
    

    def get(self, request, *args,**kwargs):
        sel = InvoiceSelector()
        res = sel.get_overdue_invoices()
        return Response(res)
        



