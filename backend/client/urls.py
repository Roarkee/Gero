from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet
from .portal_views import (
    PortalProjectView,
    PortalMessageView,
    PortalFileView,
    PortalProposalView,
    PortalProposalActionView,
    PortalInvoiceView,
    PushProposalToPortalView,
    FreelancerPortalMessageView,
    PortalRequestView,
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),

    # ── Client-facing portal ──────────────────────────────────────────────────
    path('portal/projects/', PortalProjectView.as_view({'get': 'list'}), name='portal-project-list'),
    path('portal/projects/<int:pk>/', PortalProjectView.as_view({'get': 'retrieve'}), name='portal-project-detail'),

    path('portal/projects/<int:project_pk>/messages/', PortalMessageView.as_view(), name='portal-messages'),
    path('portal/projects/<int:project_pk>/files/', PortalFileView.as_view(), name='portal-files'),
    path('portal/projects/<int:project_pk>/proposals/', PortalProposalView.as_view(), name='portal-proposals'),
    path('portal/projects/<int:project_pk>/proposals/<int:proposal_pk>/<str:action>/',
         PortalProposalActionView.as_view(), name='portal-proposal-action'),

    path('portal/invoices/', PortalInvoiceView.as_view({'get': 'list'}), name='portal-invoice-list'),
    path('portal/invoices/<int:pk>/', PortalInvoiceView.as_view({'get': 'retrieve'}), name='portal-invoice-detail'),
    path('portal/requests/', PortalRequestView.as_view(), name='portal-requests'),

    # ── Freelancer-side portal helpers ────────────────────────────────────────
    path('portal/push-proposal/', PushProposalToPortalView.as_view(), name='portal-push-proposal'),
    path('portal/projects/<int:project_pk>/freelancer-message/',
         FreelancerPortalMessageView.as_view(), name='portal-freelancer-message'),
]