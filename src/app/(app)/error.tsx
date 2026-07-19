"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="glass flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border/60 p-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-destructive/15 text-destructive">
          <TriangleAlert className="size-6" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>
        <Button onClick={() => unstable_retry()}>Try again</Button>
      </div>
    </div>
  );
}
