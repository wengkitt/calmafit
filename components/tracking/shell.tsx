"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, LayoutList, Scale, Settings2, Sprout } from "lucide-react";
import { SidebarAccount } from "@/components/auth/sidebar-account";
import { cn } from "@/lib/utils";
const links = [
  { href: "/dashboard", label: "Diary", icon: LayoutList },
  { href: "/foods", label: "Food bank", icon: BookOpen },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/settings", label: "Settings", icon: Settings2 },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-dvh md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
        <Link
          href="/dashboard"
          prefetch={true}
          className="mb-8 flex items-center gap-2.5 px-2 text-sm font-semibold tracking-tight"
        >
          <Sprout className="size-5 text-primary" />
          CalmaFit
        </Link>
        <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">Workspace</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={true}
              aria-current={path === href ? "page" : undefined}
              className={cn(
                "flex min-h-9 items-center gap-2.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                path === href && "bg-sidebar-accent font-medium text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6">
          <SidebarAccount />
        </div>
      </aside>
      <header className="flex h-14 items-center justify-between border-b px-5 md:h-12 md:px-8">
        <Link
          href="/dashboard"
          prefetch={true}
          className="flex items-center gap-2 font-semibold md:hidden"
        >
          <Sprout className="size-5 text-primary" />
          CalmaFit
        </Link>
        <span className="hidden items-center gap-2 text-[13px] text-muted-foreground md:flex">
          Workspace <ChevronRight aria-hidden="true" className="size-3.5" />
          <span className="text-foreground">{links.find((l) => l.href === path)?.label}</span>
        </span>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pt-6 pb-28 md:px-8 md:pt-8 md:pb-12">
        {children}
      </main>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            prefetch={true}
            aria-current={path === href ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] text-muted-foreground",
              path === href && "bg-sidebar-accent font-medium text-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="sr-only">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-xl">{title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
