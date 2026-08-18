from django.contrib import admin

from .models import Employee, Position, Shift, Zone


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ("name", "company")
    list_filter = ("company",)


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "company")
    list_filter = ("company",)


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "start_time", "end_time")
    list_filter = ("company",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "position",
        "company",
        "active",
    )
    list_filter = ("company", "position", "active")
    search_fields = ("first_name", "last_name")
    filter_horizontal = ("allowed_zones", "allowed_shifts")