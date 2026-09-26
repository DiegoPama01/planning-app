import { Position } from '../positions/positions.model';
import { Zone } from '../zones/zones.model';
import { ZoneShiftPreset } from './planning.model';
import { buildPlanningRows } from './planning-rows';

describe('buildPlanningRows', () => {
  const position: Position = { id: 'position-1', name: 'Front desk', color: '#000000' };
  const waiter: Position = { id: 'position-2', name: 'Waiter', color: '#111111' };
  const zone: Zone = {
    id: 'zone-1',
    name: 'Lobby',
    color: '#000000',
    shift_presets: [{ id: 'zone-preset-1', shift: 'shift-1', positions: [{ position: 'position-1', required_count: 3 }] }],
  };
  const preset: ZoneShiftPreset = { id: 'preset-1', zone: 'zone-1', shift: 'shift-1', active: true, sort_order: 0 };

  it('maps the configured zone/shift/position quantity to the row minimum', () => {
    const rows = buildPlanningRows([position], [zone], [preset], [], { zone: 'all', shift: 'all', position: 'all' });

    expect(rows).toHaveLength(1);
    expect(rows[0].minimum).toBe(3);
    expect(rows[0].requirements).toHaveLength(1);
  });

  it('groups multiple required positions into a single zone and shift row', () => {
    const rows = buildPlanningRows(
      [position, waiter],
      [{
        ...zone,
        shift_presets: [{
          id: 'zone-preset-1',
          shift: 'shift-1',
          positions: [
            { position: 'position-1', required_count: 1 },
            { position: 'position-2', required_count: 2 },
          ],
        }],
      }],
      [preset],
      [],
      { zone: 'all', shift: 'all', position: 'all' },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].minimum).toBe(3);
    expect(rows[0].requirements.map((requirement) => requirement.position.id)).toEqual(['position-1', 'position-2']);
  });

  it('keeps filters applied after mapping configured requirements', () => {
    const rows = buildPlanningRows([position], [zone], [preset], [], { zone: 'other-zone', shift: 'all', position: 'all' });

    expect(rows).toEqual([]);
  });
});
