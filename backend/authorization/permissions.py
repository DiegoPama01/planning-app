from rest_framework import permissions
from rest_framework.exceptions import APIException

from .client import OpenFGAError
from . import fga


class InstallationPlanningPermission(permissions.BasePermission):
    message = "You do not have permission to access this installation's planning."

    def has_permission(self, request, view):
        user_sub = getattr(request.user, "authentik_sub", None)
        installation_id = view.kwargs.get("company_id")
        if not user_sub or not installation_id:
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
