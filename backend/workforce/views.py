import datetime

from django.shortcuts import get_object_or_404
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from organizations.models import Company
from .models import Employee, PlanningAssignment, Position
from .serializers import (
    EmployeeSerializer,
    PlanningAssignmentSerializer,
    PlanningWeekSerializer,
    PlanningWeekWriteSerializer,
    PositionSerializer,
)


class PositionViewSet(viewsets.ModelViewSet):
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            memberships__user=self.request.user,
        )

    def get_queryset(self):
        company = self.get_company()

        return Position.objects.filter(
            company=company,
        ).order_by("name")

    def perform_create(self, serializer):
        serializer.save(
            company=self.get_company(),
        )


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            memberships__user=self.request.user,
        )

    def get_queryset(self):
        return (
            Employee.objects.filter(company=self.get_company())
            .select_related("position")
            .prefetch_related(
                "allowed_zones",
                "allowed_shifts",
            )
            .order_by("first_name", "last_name")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["company"] = self.get_company()
        return context

    def perform_create(self, serializer):
        serializer.save(
            company=self.get_company(),
        )


class PlanningWeekView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            memberships__user=self.request.user,
        )

    def get_week_start(self):
        try:
            week_start = datetime.date.fromisoformat(self.kwargs["week_start"])
        except ValueError as exc:
            raise serializers.ValidationError(
                {"week_start": "Week start must be a valid ISO date."}
            ) from exc

        if week_start.weekday() != 0:
            raise serializers.ValidationError(
                {"week_start": "Week start must be a Monday."}
            )

        return week_start

    def get_queryset(self):
        company = self.get_company()
        week_start = self.get_week_start()
        week_end = week_start + datetime.timedelta(days=6)

        return PlanningAssignment.objects.filter(
            company=company,
            work_date__range=(week_start, week_end),
        ).select_related("employee", "zone", "shift")

    def get(self, request, *args, **kwargs):
        week_start = self.get_week_start()
        serializer = PlanningWeekSerializer(
            {
                "week_start": week_start,
                "week_end": week_start + datetime.timedelta(days=6),
                "assignments": self.get_queryset(),
            }
        )
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        company = self.get_company()
        week_start = self.get_week_start()
        serializer = PlanningWeekWriteSerializer(
            data=request.data,
            context={
                "company": company,
                "week_start": week_start,
            },
        )
        serializer.is_valid(raise_exception=True)

        assignments_data = serializer.validated_data["assignments"]
        existing_assignments = {
            (assignment.employee_id, assignment.work_date): assignment
            for assignment in self.get_queryset()
        }
        seen_keys = set()
        saved_assignments = []

        for assignment_data in assignments_data:
            key = (assignment_data["employee"].id, assignment_data["work_date"])
            seen_keys.add(key)
            instance = existing_assignments.get(key)

            if instance is None:
                instance = PlanningAssignment(
                    company=company,
                    employee=assignment_data["employee"],
                    work_date=assignment_data["work_date"],
                )

            instance.zone = assignment_data["zone"]
            instance.shift = assignment_data["shift"]
            instance.save()
            saved_assignments.append(instance)

        for key, instance in existing_assignments.items():
            if key not in seen_keys:
                instance.delete()

        response_serializer = PlanningWeekSerializer(
            {
                "week_start": week_start,
                "week_end": week_start + datetime.timedelta(days=6),
                "assignments": saved_assignments,
            }
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)
