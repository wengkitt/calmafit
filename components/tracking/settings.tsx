"use client";
import { useState, useSyncExternalStore } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ActionForm, InputField } from "./forms";
import { PageHeading } from "./shell";
import { saveSettings } from "@/lib/tracking/actions";
import type { Settings } from "@/lib/tracking/data";
import { nutrientKeys, nutrientLabels } from "@/lib/tracking/nutrition";
const subscribe = () => () => {};
export function TrackingSettings({ settings }: { settings: Settings | null }) {
  const browserTimezone = useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "UTC",
  );
  const [goals, setGoals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      [...nutrientKeys, "targetWeight" as const].map((k) => [k, String(settings?.[k] ?? "")]),
    ),
  );
  const [editedTimezone, setTimezone] = useState<string | null>(null);
  const timezone = editedTimezone ?? settings?.timezone ?? browserTimezone;
  return (
    <>
      <PageHeading
        eyebrow="Make it yours"
        title="Settings"
        description="Set goals that work for you. Leave any target blank to track without a goal."
      />
      <div className="w-full">
        <ActionForm action={saveSettings} submitLabel="Save settings">
          <Card className="gap-5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8">
            <CardHeader className="w-full self-start">
              <CardTitle>Daily nutrition goals</CardTitle>
              <CardDescription>Your targets apply to every day in the diary.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-2 gap-5">
                {nutrientKeys.map((k) => (
                  <InputField
                    key={k}
                    label={`${nutrientLabels[k]} (${k === "calories" ? "kcal" : "g"})`}
                    name={k}
                    type="number"
                    inputMode="decimal"
                    min="0.001"
                    max="1000000"
                    step="any"
                    value={goals[k]}
                    onChange={(e) => setGoals({ ...goals, [k]: e.target.value })}
                    placeholder="Optional"
                  />
                ))}
              </FieldGroup>
            </CardContent>
          </Card>
          <Card className="gap-5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8">
            <CardHeader className="w-full self-start">
              <CardTitle>Weight & daily tracking</CardTitle>
              <CardDescription>
                Your timezone determines when a new tracking day starts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <InputField
                  label="Target weight (kg)"
                  name="targetWeight"
                  type="number"
                  inputMode="decimal"
                  min="0.001"
                  max="1000"
                  step="any"
                  value={goals.targetWeight}
                  onChange={(e) => setGoals({ ...goals, targetWeight: e.target.value })}
                  placeholder="Optional"
                />
                <InputField
                  label="Timezone"
                  name="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Kuala_Lumpur"
                  required
                  list="timezones"
                />
                <datalist id="timezones">
                  {[
                    "Asia/Kuala_Lumpur",
                    "Asia/Singapore",
                    "Asia/Tokyo",
                    "Europe/London",
                    "America/New_York",
                    "America/Los_Angeles",
                    "Australia/Sydney",
                    "UTC",
                  ].map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Changing timezone won’t move your existing diary entries or weigh-ins.
                </p>
              </FieldGroup>
            </CardContent>
          </Card>
        </ActionForm>
      </div>
      <div className="w-full border-t pt-6 md:hidden">
        <SignOutButton />
      </div>
    </>
  );
}
