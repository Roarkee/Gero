# intelligence/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from invoices.serializers import InvoiceListSerializer,InvoiceSerializer

from intelligence.invoice.services import (
    InvoiceIntelligenceService,
    ClientIntelligenceService,
    RevenueIntelligenceService,
    CashFlowIntelligenceService,
    CollectionIntelligenceService,
    RiskIntelligenceService,
)

class InvoiceDashboardView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        service = InvoiceIntelligenceService(
            user=request.user
        )
        # s = InvoiceSerializer(service.get_dashboard())
        # print(service.get_dashboard())
        

        return Response(
        
            service.get_dashboard(),
            
        )
    
class ClientPaymentBehaviourView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = ClientIntelligenceService(
            request.user
        )

        return Response(
            service.payment_behavior()
        )
    
class ClientRiskReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = ClientIntelligenceService(
            request.user
        )

        return Response(
            service.risk_report()
        )
    
class MonthlyRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = RevenueIntelligenceService(
            request.user
        )

        return Response(
            service.monthly_revenue()
        )
    
class TopClientsRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = RevenueIntelligenceService(
            request.user
        )

        return Response(
            service.top_clients()
        )
    
class RevenueConcentrationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = RevenueIntelligenceService(
            request.user
        )

        return Response(
            service.concentration_risk()
        )
    
class ReceivablesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = CashFlowIntelligenceService(
            request.user
        )

        return Response(
            service.receivables()
        )
    
class CollectionPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = CollectionIntelligenceService(
            request.user
        )

        return Response(
            service.performance()
        )
    
class CollectionRateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = CollectionIntelligenceService(
            request.user
        )

        return Response(
            service.collection_rate()
        )
    


class InvoiceRiskView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = RiskIntelligenceService(
            request.user
        )

        return Response(
            service.invoice_risks()
        )





