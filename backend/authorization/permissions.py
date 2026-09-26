from django.conf import settings
from rest_framework import permissions
from rest_framework.exceptions import APIException

from organizations.models import CompanyMembership, Installation
from .client import OpenFGAError
from . import fga


def user_object(user) -> str:
    return f"user:{getattr(user, 'authentik_sub', None) or user.id}"


def has_company_membership(user, company) -> bool:
    return CompanyMembership.objects.filter(user=user, company=company).exists()


def has_company_management_role(user, company) -> bool:
    return CompanyMembership.objects.filter(
        user=user,
        company=company,
        role__in=[CompanyMembership.Role.OWNER, CompanyMembership.Role.ADMIN],
    ).exists()


def _check_fga(*, user: str, relation: str, object: str) -> bool:
    try:
        return fga.check(user=user, relation=relation, object=object)
    except OpenFGAError as exc:
        raise APIException("Authorization service is unavailable.") from exc


def can_manage_company(user, company) -> bool:
    if not has_company_management_role(user, company):
        return False
    if not settings.OPENFGA["ENABLED"]:
        return True
    # Keep the existing DB membership role as a compatibility fallback while
    # OpenFGA tuples are being provisioned for existing organizations.
    _check_fga(user=user_object(user), relation="can_manage_company", object=f"company:{company.id}")
    return True


def can_create_installation(user, company) -> bool:
    if not has_company_management_role(user, company):
        return False
    if not settings.OPENFGA["ENABLED"]:
        return True
    # Keep the existing DB membership role as a compatibility fallback while
    # OpenFGA tuples are being provisioned for existing organizations.
    _check_fga(user=user_object(user), relation="can_create_installation", object=f"company:{company.id}")
    return True


def can_manage_installation(user, installation) -> bool:
    if not has_company_management_role(user, installation.company):
        return False
    if not settings.OPENFGA["ENABLED"]:
        return True
    # Keep the existing DB membership role as a compatibility fallback while
    # OpenFGA tuples are being provisioned for existing organizations.
    _check_fga(user=user_object(user), relation="can_manage", object=f"installation:{installation.id}")
    return True


class InstallationPlanningPermission(permissions.BasePermission):
    message = "You do not have permission to access this installation's planning."

    def has_permission(self, request, view):
        user_sub = getattr(request.user, "authentik_sub", None) or request.user.id
        company_id = view.kwargs.get("company_id")
        if not user_sub or not company_id:
            return False

        installation_id = (
            Installation.objects.filter(company_id=company_id)
            .order_by("created_at")
            .values_list("id", flat=True)
            .first()
        )
        if not installation_id:
            return False

        relation = "can_view_planning" if request.method in permissions.SAFE_METHODS else "can_edit_planning"
        try:
            return fga.check(
                user=f"user:{user_sub}",
                relation=relation,
                object=f"installation:{installation_id}",
            )
        except OpenFGAError as exc:
            raise APIException("Authorization service is unavailable.") from exc
