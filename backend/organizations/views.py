from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets

from organizations.models import Company
from organizations.serializers import ShiftSerializer, ZoneSerializer
from workforce.models import Shift, Zone


class ZoneViewSet(viewsets.ModelViewSet):
    serializer_class = ZoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            memberships__user=self.request.user,
        )

    def get_queryset(self):
        return Zone.objects.filter(
            company=self.get_company(),
        ).order_by("name")

    def perform_create(self, serializer):
        serializer.save(
            company=self.get_company(),
        )


class ShiftViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            memberships__user=self.request.user,
        )

    def get_queryset(self):
        return Shift.objects.filter(
            company=self.get_company(),
        ).order_by("name")

    def perform_create(self, serializer):
        serializer.save(
            company=self.get_company(),
        )
