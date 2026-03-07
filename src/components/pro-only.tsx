"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { ReactNode } from "react";

interface ProOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProOnly({ children, fallback }: ProOnlyProps) {
  const { isProUser, isLoading } = useSubscription();

  if (isLoading) return null;

  if (!isProUser) {
    return (
      fallback ?? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This feature requires a Pro subscription.
          </p>
          <button
            onClick={async () => {
              const res = await fetch("/api/checkout", { method: "POST" });
              const { url } = await res.json();
              if (url) window.location.href = url;
            }}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Upgrade to Pro
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-2 py-0.5 text-xs font-medium text-white">
      PRO
    </span>
  );
}
