import uuid

from django.conf import settings
from django.db import models

from organizations.models import Company, Installation


class Position(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    installation = models.ForeignKey(
        Installation,
        on_delete=models.CASCADE,
        related_name="positions",
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
    )
    sort_order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["installation", "name"],
                name="unique_position_name_per_installation",
            ),
        ]

    @property
    def company(self):
        return self.installation.company

    @property
    def company_id(self):
        return self.installation.company_id

    @property
    def staffing_rules(self):
        return self.staffing_requirements.filter(active=True)

    def __str__(self):
        return self.name


class Zone(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    installation = models.ForeignKey(
        Installation,
        on_delete=models.CASCADE,
        related_name="zones",
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
    )
    sort_order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    configured_shifts = models.ManyToManyField(
        "Shift",
        through="ZoneShiftPreset",
        related_name="configured_zones",
        blank=True,
    )

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["installation", "name"],
                name="unique_zone_name_per_installation",
            ),
        ]

    @property
    def company(self):
        return self.installation.company

    @property
    def company_id(self):
        return self.installation.company_id

    def __str__(self):
        return self.name


class Shift(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    installation = models.ForeignKey(
        Installation,
        on_delete=models.CASCADE,
        related_name="shifts",
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, blank=True, null=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_minutes = models.PositiveIntegerField(default=0)
    color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
    )
    sort_order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "start_time", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["installation", "name"],
                name="unique_shift_name_per_installation",
            ),
        ]

    @property
    def company(self):
        return self.installation.company

    @property
    def company_id(self):
        return self.installation.company_id

    def __str__(self):
        return self.name


class ZoneShiftPreset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="zone_shift_presets")
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name="shift_presets")
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name="zone_presets")
    active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "zone__name", "shift__start_time"]
        constraints = [
            models.UniqueConstraint(fields=["company", "zone", "shift"], name="unique_zone_shift_preset_per_company"),
        ]

    def __str__(self):
        return f"{self.zone} - {self.shift}"


class ZoneShiftPositionRequirement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="zone_shift_position_requirements")
    zone_shift_preset = models.ForeignKey(
        ZoneShiftPreset,
        on_delete=models.CASCADE,
        related_name="position_requirements",
    )
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name="zone_shift_requirements")
    required_count = models.PositiveIntegerField(default=1)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "zone_shift_preset", "position"],
                name="unique_position_per_zone_shift",
            ),
        ]

    def __str__(self):
        return f"{self.zone_shift_preset} - {self.position} ({self.required_count})"


class StaffingRequirement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="staffing_requirements")
    weekday = models.PositiveSmallIntegerField()
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name="staffing_requirements")
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name="staffing_requirements")
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name="staffing_requirements")
    minimum_count = models.PositiveIntegerField(default=0)
    maximum_count = models.PositiveIntegerField(null=True, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "weekday", "position", "zone", "shift"],
                name="unique_staffing_requirement_per_weekday",
            ),
            models.CheckConstraint(condition=models.Q(weekday__gte=0, weekday__lte=6), name="valid_staffing_weekday"),
        ]

    def __str__(self):
        return f"{self.position} - {self.zone} - {self.shift} ({self.weekday})"


class Employee(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    installation = models.ForeignKey(
        Installation,
        on_delete=models.CASCADE,
        related_name="employees",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="employees",
        blank=True,
        null=True,
    )
    employee_code = models.CharField(max_length=50, blank=True, null=True)
    position = models.ForeignKey(
        Position,
        on_delete=models.PROTECT,
        related_name="employees",
        blank=True,
        null=True,
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(
        max_length=150,
        blank=True,
    )
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    termination_date = models.DateField(blank=True, null=True)
    color = models.CharField(max_length=7, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    allowed_zones = models.ManyToManyField(
        Zone,
        related_name="employees",
        blank=True,
    )
    allowed_shifts = models.ManyToManyField(
        Shift,
        related_name="employees",
        blank=True,
    )

    class Meta:
        ordering = ["first_name", "last_name"]

    @property
    def company(self):
        return self.installation.company

    @property
    def company_id(self):
        return self.installation.company_id

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


class PlanningAssignment(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="planning_assignments",
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="planning_assignments",
    )
    work_date = models.DateField()
    zone = models.ForeignKey(
        Zone,
        on_delete=models.PROTECT,
        related_name="planning_assignments",
    )
    shift = models.ForeignKey(
        Shift,
        on_delete=models.PROTECT,
        related_name="planning_assignments",
    )
    note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "employee", "work_date"],
                name="unique_planning_assignment_per_employee_date",
            ),
        ]
        ordering = ["work_date", "employee__first_name", "employee__last_name"]

    def __str__(self):
        return f"{self.employee} - {self.work_date}"
