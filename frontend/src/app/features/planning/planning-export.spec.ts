import { buildPlanningCsv } from './planning-export';

describe('buildPlanningCsv', () => {
  it('creates a CSV row and escapes special characters', () => {
    const csv = buildPlanningCsv([{
      employee: 'Ana García',
      position: 'Front desk',
      cells: [{
        date: '2026-09-14', day: 'Mon', zone: 'Lobby', shift: 'Morning',
        startTime: '08:00', endTime: '16:00', note: 'Cover, "VIP" desk',
      }],
    }]);

    expect(csv).toBe(
      'Date,Day,Employee,Position,Zone,Shift,Start,End,Note\r\n' +
      '2026-09-14,Mon,Ana García,Front desk,Lobby,Morning,08:00,16:00,"Cover, ""VIP"" desk"\r\n',
    );
  });

  it('keeps empty assignments in the export', () => {
    const csv = buildPlanningCsv([{
      employee: 'Sam Lee',
      position: 'Server',
      cells: [{ date: '2026-09-15', day: 'Tue', zone: '', shift: '', startTime: '', endTime: '', note: '' }],
    }]);

    expect(csv).toContain('2026-09-15,Tue,Sam Lee,Server,,,,,');
  });
});
