"use client";

import { useEffect } from "react";
import { ErrorCard } from "@/components/ErrorCard";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AppError:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorCard
        title="Deal AI crashed"
        message="We hit an error loading this part of the app. Try again — if it keeps happening, it’s probably a network or config issue."
        details={`${error?.message ?? error}\n${error?.digest ? `\nDigest: ${error.digest}` : ""}`}
        onRetry={reset}
        href="/app"
        hrefLabel="Go to Dashboard"
      />
    </div>
  );
}
