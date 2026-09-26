import { Position } from '../positions/positions.model';
import { Zone } from '../zones/zones.model';
import { StaffingRequirement, ZoneShiftPreset } from './planning.model';

export interface PlanningRow {
  id: string;
  preset: ZoneShiftPreset;
  requirements: PlanningRowPositionRequirement[];
  minimum: number;
  maximum: number | null;
}

export interface PlanningRowPositionRequirement {
  id: string;
  position: Position;
  minimum: number;
  maximum: number | null;
}

export interface PlanningRowFilters {
  zone: string;
  shift: string;
  position: string;
}

interface PlanningRowRequirement {
  id: string;
  position: string;
  zone: string;
  shift: string;
  minimum_count: number;
  maximum_count: number | null;
}

export function buildPlanningRows(
  positions: Position[],
  zones: Zone[],
  presets: ZoneShiftPreset[],
  requirements: StaffingRequirement[],
  filters: PlanningRowFilters,
): PlanningRow[] {
  const configuredRequirements: PlanningRowRequirement[] = zones.flatMap((zone) =>
    (zone.shift_presets ?? []).flatMap((zonePreset) =>
      zonePreset.positions.map((positionRequirement) => ({
        id: `${zone.id}:${zonePreset.id}:${positionRequirement.position}`,
        position: positionRequirement.position,
        zone: zone.id,
        shift: zonePreset.shift,
        minimum_count: positionRequirement.required_count,
        maximum_count: null,
      })),
    ),
  );

  // Zone configuration is the current source of truth for required positions.
  // Keep the legacy staffing requirements as a compatibility fallback for older data.
  const source = configuredRequirements.length > 0 ? configuredRequirements : requirements;
  const positionsById = new Map(positions.map((position) => [position.id, position]));

  const rowsByPreset = new Map<string, PlanningRow>();

  for (const requirement of source) {
    const preset = presets.find(
      (item) => item.zone === requirement.zone && item.shift === requirement.shift,
    );
    const position = positionsById.get(requirement.position);
    if (!preset || !position) continue;

    const rowId = `${requirement.zone}:${requirement.shift}`;
    const current = rowsByPreset.get(rowId) ?? {
      id: rowId,
      preset,
      requirements: [],
      minimum: 0,
      maximum: 0,
    };
    current.requirements.push({
      id: requirement.id,
      position,
      minimum: requirement.minimum_count,
      maximum: requirement.maximum_count,
    });
    current.minimum += requirement.minimum_count;
    current.maximum = current.maximum === null || requirement.maximum_count === null
      ? null
      : current.maximum + requirement.maximum_count;
    rowsByPreset.set(rowId, current);
  }

  return [...rowsByPreset.values()].map((row) => ({
      ...row,
      requirements: row.requirements.sort((first, second) => first.position.name.localeCompare(second.position.name)),
    }))
    .filter(
      (row) =>
        (filters.zone === 'all' || row.preset.zone === filters.zone) &&
        (filters.shift === 'all' || row.preset.shift === filters.shift) &&
        (filters.position === 'all' || row.requirements.some((requirement) => requirement.position.id === filters.position)),
    );
}
