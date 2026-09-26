from rest_framework import serializers

from workforce.models import Position, Shift, Zone, ZoneShiftPositionRequirement, ZoneShiftPreset
from organizations.models import Company, Installation


class InstallationInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False)
    code = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    timezone = serializers.CharField(max_length=64, required=False, allow_blank=True, allow_null=True)
    active = serializers.BooleanField(required=False, default=True)


class CompanySerializer(serializers.ModelSerializer):
    initial_installation = InstallationInputSerializer(write_only=True, required=False)

    class Meta:
        model = Company
        fields = (
            "id",
            "name",
            "slug",
            "legal_name",
            "tax_id",
            "timezone",
            "active",
            "created_at",
            "updated_at",
            "initial_installation",
        )
        read_only_fields = ("id", "slug", "created_at", "updated_at")


class InstallationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installation
        fields = (
            "id",
            "company",
            "name",
            "code",
            "address",
            "timezone",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "company", "created_at", "updated_at")


class ZoneShiftPositionRequirementInputSerializer(serializers.Serializer):
    position = serializers.UUIDField()
    required_count = serializers.IntegerField(min_value=1)


class ZoneShiftPresetInputSerializer(serializers.Serializer):
    shift = serializers.UUIDField()
    positions = ZoneShiftPositionRequirementInputSerializer(many=True, required=False)


class ZoneSerializer(serializers.ModelSerializer):
    shift_presets = ZoneShiftPresetInputSerializer(many=True, required=False, write_only=True)
    installation = serializers.PrimaryKeyRelatedField(queryset=Installation.objects.none(), required=False)

    class Meta:
        model = Zone
        fields = (
            "id",
            "installation",
            "name",
            "code",
            "description",
            "color",
            "sort_order",
            "active",
            "created_at",
            "updated_at",
            "shift_presets",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        company = self.context.get("company")
        if company:
            self.fields["installation"].queryset = Installation.objects.filter(company=company)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["shift_presets"] = [
            {
                "id": preset.id,
                "shift": preset.shift_id,
                "positions": list(
                    preset.position_requirements.filter(
                        company=instance.company,
                    ).values("position", "required_count")
                ),
            }
            for preset in instance.shift_presets.filter(active=True).prefetch_related("position_requirements")
        ]
        return data

    def create(self, validated_data):
        shift_presets = validated_data.pop("shift_presets", [])
        instance = super().create(validated_data)
        self._sync_shifts(instance, shift_presets)
        return instance

    def update(self, instance, validated_data):
        shift_presets = validated_data.pop("shift_presets", None)
        instance = super().update(instance, validated_data)
        if shift_presets is not None:
            self._sync_shifts(instance, shift_presets)
        return instance

    def _sync_shifts(self, zone, shift_presets):
        company = self.context["company"]
        ZoneShiftPreset.objects.filter(company=company, zone=zone).update(active=False)
        for item in shift_presets:
            shift = serializers.PrimaryKeyRelatedField(
                queryset=Shift.objects.filter(installation__company=company),
            ).to_internal_value(item["shift"])
            if shift.installation_id != zone.installation_id:
                raise serializers.ValidationError("All shifts must belong to the zone installation.")
            preset, _ = ZoneShiftPreset.objects.update_or_create(
                company=company,
                zone=zone,
                shift=shift,
                defaults={"active": True},
            )
            ZoneShiftPositionRequirement.objects.filter(
                company=company,
                zone_shift_preset=preset,
            ).delete()
            for position_item in item.get("positions", []):
                position = position_item["position"]
                if not Position.objects.filter(id=position, installation=zone.installation).exists():
                    raise serializers.ValidationError("All positions must belong to the zone installation.")
                ZoneShiftPositionRequirement.objects.create(
                    company=company,
                    zone_shift_preset=preset,
                    position_id=position,
                    required_count=position_item.get("required_count", 1),
                )


class ShiftSerializer(serializers.ModelSerializer):
    installation = serializers.PrimaryKeyRelatedField(queryset=Installation.objects.none(), required=False)

    class Meta:
        model = Shift
        fields = (
            "id",
            "installation",
            "name",
            "code",
            "start_time",
            "end_time",
            "break_minutes",
            "color",
            "sort_order",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        company = self.context.get("company")
        if company:
            self.fields["installation"].queryset = Installation.objects.filter(company=company)
