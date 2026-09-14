from django.urls import path

from .views import (
    AuthentikTokenView,
    MeView,
    OidcExchangeView,
    OidcRefreshView,
    SignupView,
)


urlpatterns = [
    path(
        "token/",
        AuthentikTokenView.as_view(),
        name="token",
    ),
    path(
        "token/refresh/",
        OidcRefreshView.as_view(),
        name="token-refresh",
    ),
    path(
        "oidc/exchange/",
        OidcExchangeView.as_view(),
        name="oidc-exchange",
    ),
    path(
        "oidc/refresh/",
        OidcRefreshView.as_view(),
        name="oidc-refresh",
    ),
    path(
        "signup/",
        SignupView.as_view(),
        name="signup",
    ),
    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
]
