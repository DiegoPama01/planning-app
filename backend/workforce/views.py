from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets

from organizations.models import Company
from .models import Employee, Position
from .serializers import PositionSerializer, EmployeeSerializer


class PositionViewSet(viewsets.ModelViewSet):
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            memberships__user=self.request.user,
        )

    def get_queryset(self):
        company = self.get_company()

        return Position.objects.filter(
            company=company,
        ).order_by("name")

    def perform_create(self, serializer):
        serializer.save(
            company=self.get_company(),
        )
        
        
class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            memberships__user=self.request.user,
        )

    def get_queryset(self):
        return (
            Employee.objects
            .filter(company=self.get_company())
            .select_related("position")
            .prefetch_related(
                "allowed_zones",
                "allowed_shifts",
            )
            .order_by("first_name", "last_name")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["company"] = self.get_company()
        return context

    def perform_create(self, serializer):
        serializer.save(
            company=self.get_company(),
        )