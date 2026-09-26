export interface Zone {
  id: string;
  installation?: string | null;
  name: string;
  code?: string | null;
  description?: string | null;
  color: string;
  sort_order?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  shift_presets?: ZoneShiftPreset[];
}

export interface ZoneShiftPreset {
  id: string;
  shift: string;
  positions: ZoneShiftPositionRequirement[];
}

export interface ZoneShiftPositionRequirement {
  position: string;
  required_count: number;
}

export interface ZoneUpsertPayload {
  installation?: string;
  name: string;
  code: string;
  description: string;
  color: string;
  sort_order: number;
  active: boolean;
  shift_presets: ZoneShiftPresetInput[];
}

export interface ZoneShiftPresetInput {
  shift: string;
  positions: ZoneShiftPositionRequirement[];
}
