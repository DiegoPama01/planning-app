from django.urls import path

from organizations.views import ShiftViewSet, ZoneViewSet

from .views import PositionViewSet, EmployeeViewSet


position_list = PositionViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

position_detail = PositionViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)


zone_list = ZoneViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

zone_detail = ZoneViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

shift_list = ShiftViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

shift_detail = ShiftViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

employee_list = EmployeeViewSet.as_view({
    "get": "list",
    "post": "create",
})

employee_detail = EmployeeViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})


urlpatterns = [
    path(
        "companies/<uuid:company_id>/positions/",
        position_list,
        name="position-list",
    ),
    path(
        "companies/<uuid:company_id>/positions/<uuid:pk>/",
        position_detail,
        name="position-detail",
    ),
    path(
        "companies/<uuid:company_id>/zones/",
        zone_list,
        name="zone-list",
    ),
    path(
        "companies/<uuid:company_id>/zones/<uuid:pk>/",
        zone_detail,
        name="zone-detail",
    ),
    path(
        "companies/<uuid:company_id>/shifts/",
        shift_list,
        name="shift-list",
    ),
    path(
        "companies/<uuid:company_id>/shifts/<uuid:pk>/",
        shift_detail,
        name="shift-detail",
    ),
    path(
        "companies/<uuid:company_id>/employees/",
        employee_list,
        name="employee-list",
    ),
    path(
        "companies/<uuid:company_id>/employees/<uuid:pk>/",
        employee_detail,
        name="employee-detail",
    ),
]
