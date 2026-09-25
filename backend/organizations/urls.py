from django.urls import path

from .views import InstallationCreateView


urlpatterns = [
    path("installations/", InstallationCreateView.as_view(), name="installation-list"),
]
