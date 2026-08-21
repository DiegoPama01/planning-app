export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
}

export interface ShiftUpsertPayload {
  name: string;
  start_time: string;
  end_time: string;
  color: string;
}
