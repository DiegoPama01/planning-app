from rest_framework import serializers

from .models import Employee, Position, Shift, Zone


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = (
            "id",
            "name",
            "color"
        )
        read_only_fields = (
            "id",
        )
        
        
        
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