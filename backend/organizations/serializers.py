from rest_framework import serializers

from workforce.models import Shift, Zone


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = (
            "id",
            "name",
            "color",
        )
        read_only_fields = ("id",)


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = (
            "id",
            "name",
            "start_time",
            "end_time",
            "color",
        )
        read_only_fields = ("id",)
