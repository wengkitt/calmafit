import { displayDate, shiftDate } from "./nutrition";
export function weightPoints(entries: { date: string; kilograms: number }[]) {
  const rows = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const points: { date: number; kilograms: number | null }[] = [];
  rows.forEach((row, i) => {
    if (i && shiftDate(rows[i - 1].date, 1) !== row.date)
      points.push({ date: Date.parse(shiftDate(rows[i - 1].date, 1)), kilograms: null });
    points.push({ date: Date.parse(row.date), kilograms: row.kilograms });
  });
  return points;
}
export function chartDateLabel(value: unknown) {
  const date = typeof value === "number" ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? displayDate(date.toISOString().slice(0, 10))
    : "Weight";
}
