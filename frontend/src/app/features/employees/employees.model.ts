export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  active: boolean;
  position: string;
  allowed_zones: string[];
  allowed_shifts: string[];
}

export interface EmployeeUpsertPayload {
  first_name: string;
  last_name: string;
  active: boolean;
  position: string;
  allowed_zones: string[];
  allowed_shifts: string[];
}
