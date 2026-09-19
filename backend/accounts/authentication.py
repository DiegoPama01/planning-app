import base64
import json
from typing import Any

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from organizations.bootstrap import ensure_user_company_membership

from .authentik import AuthentikProvisioningError, get_userinfo
from .models import User


class AuthentikUserInfoAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate_header(self, request):
        return self.keyword

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        parts = header.split(" ", 1)
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1].strip()
        if not token:
            return None

        if not _looks_like_authentik_token(token):
            return None

        try:
            claims = get_userinfo(token)
        except AuthentikProvisioningError as exc:
            if exc.status_code in {401, 403}:
                raise AuthenticationFailed(str(exc)) from exc
            return None

        user = _sync_user_from_claims(claims)
        if isinstance(user, AnonymousUser):
            return None
        return (user, token)


def _sync_user_from_claims(claims: dict[str, Any]) -> User | AnonymousUser:
    email = claims.get("email")
    if not isinstance(email, str) or not email:
        return AnonymousUser()

    raw_name = claims.get("name")
    name = raw_name if isinstance(raw_name, str) else ""
    first_name, last_name = _split_name(name)

    user, created = User.objects.get_or_create(
        email=email.lower(),
        defaults={
            "first_name": first_name,
            "last_name": last_name,
        },
    )

    updated_fields: list[str] = []
    if not created and first_name and user.first_name != first_name:
        user.first_name = first_name
        updated_fields.append("first_name")
    if not created and last_name and user.last_name != last_name:
        user.last_name = last_name
        updated_fields.append("last_name")
    if updated_fields:
        user.save(update_fields=updated_fields)
    ensure_user_company_membership(user)
    return user


def _split_name(name: str) -> tuple[str, str]:
    first_name, _, last_name = name.strip().partition(" ")
    return first_name, last_name.strip()


def _looks_like_authentik_token(token: str) -> bool:
    payload = _decode_jwt_payload(token)
    issuer = payload.get("iss") if isinstance(payload.get("iss"), str) else ""
    configured_issuer = settings.AUTHENTIK["ISSUER_URL"]

    # Authentik can return opaque access tokens. Let its userinfo endpoint
    # validate those instead of rejecting them before the request is made.
    if not payload:
        return True

    return bool(
        issuer
        and configured_issuer
        and issuer.rstrip("/") == configured_issuer.rstrip("/")
    )


def _decode_jwt_payload(token: str) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        return {}

    payload = parts[1]
    payload += "=" * (-len(payload) % 4)

    try:
        decoded = base64.urlsafe_b64decode(payload.encode("utf-8")).decode("utf-8")
        parsed = json.loads(decoded)
    except (ValueError, json.JSONDecodeError):
        return {}

    return parsed if isinstance(parsed, dict) else {}
