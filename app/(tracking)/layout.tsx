import { AppShell } from "@/components/tracking/shell";

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
