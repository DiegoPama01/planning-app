from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from authorization import fga
from organizations.bootstrap import _build_unique_slug
from organizations.models import Company
from organizations.serializers import InstallationSerializer, ShiftSerializer, ZoneSerializer
from organizations.models import CompanyMembership
from workforce.models import Shift, Zone


class InstallationCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = InstallationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        installation = Company.objects.create(
            name=serializer.validated_data["name"],
            slug=_build_unique_slug(serializer.validated_data["name"], request.user.id),
        )
        CompanyMembership.objects.create(
            company=installation,
            user=request.user,
            role=CompanyMembership.Role.ADMIN,
        )
        fga.provision_installation(
            installation_id=installation.id,
            user_sub=request.user.authentik_sub,
        )
        return Response(
            InstallationSerializer(installation).data,
            status=status.HTTP_201_CREATED,
        )


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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["company"] = self.get_company()
        return context

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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["company"] = self.get_company()
        return context

    def perform_create(self, serializer):
        serializer.save(
            company=self.get_company(),
        )
