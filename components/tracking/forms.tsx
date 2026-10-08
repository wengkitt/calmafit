"use client";

import { createContext, useContext, useId, useRef, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { ActionResult } from "@/lib/tracking/actions";

const FormContext = createContext<ActionResult | null>(null);
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  onSuccess,
}: {
  action: (data: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const request = useRef<string | null>(null);
  const inFlight = useRef(false);
  return (
    <FormContext value={result}>
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (inFlight.current) return;
          const data = new FormData(event.currentTarget);
          request.current ??= crypto.randomUUID();
          data.set("requestId", request.current);
          inFlight.current = true;
          startTransition(async () => {
            try {
              const next = await action(data);
              setResult(next);
              if (next.ok) {
                request.current = null;
                onSuccess?.();
              }
            } catch {
              setResult({
                ok: false,
                message: "Connection interrupted. Your input is still here—try again.",
              });
            } finally {
              inFlight.current = false;
            }
          });
        }}
      >
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-6">
          {children}
        </fieldset>
        {result && (
          <Alert
            variant={result.ok ? "default" : "destructive"}
            role={result.ok ? "status" : "alert"}
          >
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </form>
    </FormContext>
  );
}
export function InputField({
  label,
  name,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  const id = useId(),
    result = useContext(FormContext),
    error = result?.errors?.[name];
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        {...props}
        name={name}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
export function SelectField({
  label,
  name,
  children,
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { label: string; name: string }) {
  const id = useId(),
    result = useContext(FormContext),
    error = result?.errors?.[name];
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        {...props}
        className="w-full"
        name={name}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {children}
      </NativeSelect>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
