from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from .authentication import AuthentikUserInfoAuthentication
from .authentik import AuthentikProvisioningError


class AuthentikAuthenticationTests(SimpleTestCase):
    def test_userinfo_401_is_exposed_as_http_401(self):
        request = Request(
            APIRequestFactory().get(
                "/api/auth/me/",
                HTTP_AUTHORIZATION="Bearer expired-access",
            )
        )
        authenticator = AuthentikUserInfoAuthentication()

        with patch(
            "accounts.authentication.get_userinfo",
            side_effect=AuthentikProvisioningError(
                "Authentik request failed with status 401.",
                status_code=401,
            ),
        ):
            with self.assertRaises(AuthenticationFailed) as raised:
                authenticator.authenticate(request)

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(authenticator.authenticate_header(request), "Bearer")

    def test_userinfo_403_is_exposed_as_http_401(self):
        request = Request(
            APIRequestFactory().get(
                "/api/auth/me/",
                HTTP_AUTHORIZATION="Bearer expired-access",
            )
        )
        authenticator = AuthentikUserInfoAuthentication()

        with patch(
            "accounts.authentication.get_userinfo",
            side_effect=AuthentikProvisioningError(
                "Authentik request failed with status 403.",
                status_code=403,
            ),
        ):
            with self.assertRaises(AuthenticationFailed) as raised:
                authenticator.authenticate(request)

        self.assertEqual(raised.exception.status_code, 401)
