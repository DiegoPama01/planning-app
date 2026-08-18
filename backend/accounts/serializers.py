from rest_framework import serializers

from organizations.models import CompanyMembership
from .models import User


class CompanyMembershipSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="company.id", read_only=True)
    name = serializers.CharField(source="company.name", read_only=True)
    slug = serializers.CharField(source="company.slug", read_only=True)

    class Meta:
        model = CompanyMembership
        fields = (
            "id",
            "name",
            "slug",
            "role",
        )


class MeSerializer(serializers.ModelSerializer):
    companies = CompanyMembershipSerializer(
        source="company_memberships",
        many=True,
        read_only=True,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "companies",
        )