export interface Zone {
  id: string;
  name: string;
  color: string;
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
  name: string;
  color: string;
  shift_presets: ZoneShiftPresetInput[];
}

export interface ZoneShiftPresetInput {
  shift: string;
  positions: ZoneShiftPositionRequirement[];
}
