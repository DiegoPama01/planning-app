export interface PlanningAssignment {
  id: string;
  employee: string;
  work_date: string;
  zone: string;
  shift: string;
}

export interface PlanningWeekResponse {
  week_start: string;
  week_end: string;
  assignments: PlanningAssignment[];
}

export interface PlanningWeekWriteAssignment {
  employee: string;
  work_date: string;
  zone: string;
  shift: string;
}

export interface PlanningWeekWritePayload {
  assignments: PlanningWeekWriteAssignment[];
}
