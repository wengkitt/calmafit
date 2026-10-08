"use client";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EmptyState } from "./states";
import type { WeightEntry } from "@/lib/tracking/data";
import { chartDateLabel, weightPoints } from "@/lib/tracking/chart";
export default function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const rows = [...entries].reverse();
  if (!rows.length)
    return (
      <EmptyState
        title="Your journey starts with one entry"
        description="Log your weight to see how it changes over time."
      />
    );
  const points = weightPoints(entries);
  return (
    <figure className="flex flex-col gap-3">
      <ChartContainer
        config={{ kilograms: { label: "Weight (kg)", color: "var(--primary)" } }}
        className="h-64 w-full"
        aria-label="Weight history in kilograms"
      >
        <LineChart
          accessibilityLayer
          data={points}
          margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            type="number"
            scale="time"
            domain={
              rows.length === 1
                ? [points[0].date - 86400000, points[0].date + 86400000]
                : ["dataMin", "dataMax"]
            }
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })
            }
            tickLine={false}
            axisLine={false}
            minTickGap={36}
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => chartDateLabel(payload[0]?.payload?.date)}
              />
            }
          />
          <Line
            dataKey="kilograms"
            type="linear"
            stroke="var(--color-kilograms)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
      <figcaption className="text-xs text-muted-foreground">
        Measurements in kg. Days without a measurement are left as gaps.
      </figcaption>
    </figure>
  );
}
