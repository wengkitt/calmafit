"use client";

import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSignOut } from "./sign-out-button";

export function SidebarAccount() {
  const { data: session } = authClient.useSession();
  const { signOut, pending, error } = useSignOut();
  const name = session?.user.name?.trim() || "Account";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Unable to sign out. Please try again.</AlertDescription>
        </Alert>
      )}
      <div className="flex min-h-14 items-center gap-3 px-2 py-2">
        <Avatar aria-hidden="true">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[13px] font-medium">{name}</span>
          <span className="text-xs text-muted-foreground" role="status">
            {pending ? "Signing out…" : "Personal account"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={pending ? "Signing out" : "Sign out"}
          title="Sign out"
          onClick={signOut}
          disabled={pending}
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );
}
