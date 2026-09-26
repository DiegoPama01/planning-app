export interface Employee {
  id: string;
  installation?: string | null;
  user?: number | null;
  employee_code?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  color?: string | null;
  notes?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  position: string;
  allowed_zones: string[];
  allowed_shifts: string[];
}

export interface EmployeeUpsertPayload {
  installation?: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hire_date: string;
  termination_date: string;
  color: string;
  notes: string;
  active: boolean;
  position: string;
  allowed_zones: string[];
  allowed_shifts: string[];
}
