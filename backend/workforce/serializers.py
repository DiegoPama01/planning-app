import datetime

from rest_framework import serializers

from .models import Employee, PlanningAssignment, Position, Shift, Zone


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ("id", "name", "color")
        read_only_fields = ("id",)


class EmployeeSerializer(serializers.ModelSerializer):
    position = serializers.PrimaryKeyRelatedField(
        queryset=Position.objects.none(),
    )
    allowed_zones = serializers.PrimaryKeyRelatedField(
        queryset=Zone.objects.none(),
        many=True,
        required=False,
    )
    allowed_shifts = serializers.PrimaryKeyRelatedField(
        queryset=Shift.objects.none(),
        many=True,
        required=False,
    )

    class Meta:
        model = Employee
        fields = (
            "id",
            "first_name",
            "last_name",
            "active",
            "position",
            "allowed_zones",
            "allowed_shifts",
        )
        read_only_fields = ("id",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        company = self.context.get("company")

        if company:
            self.fields["position"].queryset = Position.objects.filter(
                company=company,
            )
            self.fields["allowed_zones"].queryset = Zone.objects.filter(
                company=company,
            )
            self.fields["allowed_shifts"].queryset = Shift.objects.filter(
                company=company,
            )


class PlanningAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanningAssignment
        fields = (
            "id",
            "employee",
            "work_date",
            "zone",
            "shift",
        )
        read_only_fields = ("id",)


class PlanningWeekSerializer(serializers.Serializer):
    week_start = serializers.DateField()
    week_end = serializers.DateField()
    assignments = PlanningAssignmentSerializer(many=True)


class PlanningAssignmentWriteSerializer(serializers.Serializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.none())
    work_date = serializers.DateField()
    zone = serializers.PrimaryKeyRelatedField(queryset=Zone.objects.none())
    shift = serializers.PrimaryKeyRelatedField(queryset=Shift.objects.none())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        company = self.context.get("company")

        if company:
            self.fields["employee"].queryset = Employee.objects.filter(company=company)
            self.fields["zone"].queryset = Zone.objects.filter(company=company)
            self.fields["shift"].queryset = Shift.objects.filter(company=company)

    def validate(self, attrs):
        company = self.context["company"]
        week_start = self.context["week_start"]
        week_end = week_start + datetime.timedelta(days=6)
        employee = attrs["employee"]
        zone = attrs["zone"]
        shift = attrs["shift"]
        work_date = attrs["work_date"]

        if employee.company_id != company.id:
            raise serializers.ValidationError(
                {"employee": "Employee must belong to the active company."}
            )

        if zone.company_id != company.id:
            raise serializers.ValidationError(
                {"zone": "Zone must belong to the active company."}
            )

        if shift.company_id != company.id:
            raise serializers.ValidationError(
                {"shift": "Shift must belong to the active company."}
            )

        if not employee.allowed_zones.filter(id=zone.id).exists():
            raise serializers.ValidationError(
                {"zone": "Zone is not allowed for this employee."}
            )

        if not employee.allowed_shifts.filter(id=shift.id).exists():
            raise serializers.ValidationError(
                {"shift": "Shift is not allowed for this employee."}
            )

        if work_date < week_start or work_date > week_end:
            raise serializers.ValidationError(
                {"work_date": "Work date must belong to the selected week."}
            )

        return attrs


class PlanningWeekWriteSerializer(serializers.Serializer):
    assignments = PlanningAssignmentWriteSerializer(many=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        company = self.context.get("company")
        week_start = self.context.get("week_start")

        if not company or not week_start:
            return

        child = self.fields["assignments"].child
        child.context.update(
            {
                "company": company,
                "week_start": week_start,
            }
        )
        child.fields["employee"].queryset = Employee.objects.filter(company=company)
        child.fields["zone"].queryset = Zone.objects.filter(company=company)
        child.fields["shift"].queryset = Shift.objects.filter(company=company)

    def validate(self, attrs):
        assignments = attrs["assignments"]
        seen_keys = set()

        for assignment in assignments:
            key = (assignment["employee"].id, assignment["work_date"])

            if key in seen_keys:
                raise serializers.ValidationError(
                    {
                        "assignments": "Each employee can only have one assignment per day."
                    }
                )

            seen_keys.add(key)

        return attrs
