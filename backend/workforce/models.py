import uuid

from django.db import models

from organizations.models import Company


class Position(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="positions",
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7,
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"],
                name="unique_position_name_per_company",
            ),
        ]

    def __str__(self):
        return self.name


class Zone(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="zones",
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7,
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"],
                name="unique_zone_name_per_company",
            ),
        ]

    def __str__(self):
        return self.name


class Shift(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="shifts",
    )
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    color = models.CharField(
        max_length=7,
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"],
                name="unique_shift_name_per_company",
            ),
        ]

    def __str__(self):
        return self.name


class Employee(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="employees",
    )
    position = models.ForeignKey(
        Position,
        on_delete=models.PROTECT,
        related_name="employees",
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(
        max_length=150,
        blank=True,
    )
    active = models.BooleanField(default=True)

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

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()