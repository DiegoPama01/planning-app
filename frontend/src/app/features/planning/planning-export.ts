export interface PlanningExportCell {
  date: string;
  day: string;
  zone: string;
  shift: string;
  startTime: string;
  endTime: string;
  note: string;
}

export interface PlanningExportRow {
  employee: string;
  position: string;
  cells: PlanningExportCell[];
}

const CSV_HEADERS = ['Date', 'Day', 'Employee', 'Position', 'Zone', 'Shift', 'Start', 'End', 'Note'];

export function buildPlanningCsv(rows: PlanningExportRow[]): string {
  const csvRows = [CSV_HEADERS, ...rows.flatMap((row) => row.cells.map((cell) => [
    cell.date, cell.day, row.employee, row.position, cell.zone, cell.shift,
    cell.startTime, cell.endTime, cell.note,
  ]))];

  return csvRows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n') + '\r\n';
}

function escapeCsvValue(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
