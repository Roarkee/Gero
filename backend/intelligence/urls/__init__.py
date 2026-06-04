from django.urls import include, path

urlpatterns = [

    path("projects/",include("intelligence.urls.project")),

    # path("clients/",include("intelligence.urls.client")),

    path("invoices/",include("intelligence.urls.invoice")),

]