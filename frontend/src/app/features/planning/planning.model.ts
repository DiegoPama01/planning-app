export interface PlanningAssignment {
  id: string;
  employee: string;
  work_date: string;
  zone: string;
  shift: string;
  note: string;
}

export interface PlanningWeekResponse {
  week_start: string;
  week_end: string;
  assignments: PlanningAssignment[];
  zone_shift_presets?: ZoneShiftPreset[];
  requirements?: StaffingRequirement[];
}

export interface ZoneShiftPreset {
  id: string;
  zone: string;
  shift: string;
  active: boolean;
  sort_order: number;
}

export interface StaffingRequirement {
  id: string;
  weekday: number;
  position: string;
  zone: string;
  shift: string;
  minimum_count: number;
  maximum_count: number | null;
  active: boolean;
}

export interface PlanningWeekWriteAssignment {
  employee: string;
  work_date: string;
  zone: string;
  shift: string;
  note: string;
}

export interface PlanningWeekWritePayload {
  assignments: PlanningWeekWriteAssignment[];
}
