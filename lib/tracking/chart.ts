import { utc } from "@date-fns/utc";
import { format } from "date-fns/format";
import { isValid } from "date-fns/isValid";
import { parseISO } from "date-fns/parseISO";

import { shiftDate } from "./nutrition";

const utcOptions = { in: utc };

export function weightPoints(entries: { date: string; kilograms: number }[]) {
  const rows = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const points: { date: number; kilograms: number | null }[] = [];
  rows.forEach((row, i) => {
    if (i && shiftDate(rows[i - 1].date, 1) !== row.date)
      points.push({
        date: parseISO(shiftDate(rows[i - 1].date, 1), utcOptions).getTime(),
        kilograms: null,
      });
    points.push({ date: parseISO(row.date, utcOptions).getTime(), kilograms: row.kilograms });
  });
  return points;
}
export function chartDateLabel(value: unknown, pattern = "MMM d, yyyy") {
  return typeof value === "number" && isValid(value)
    ? format(value, pattern, utcOptions)
    : "Weight";
}
