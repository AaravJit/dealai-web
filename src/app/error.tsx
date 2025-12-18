"use client";

import { useEffect } from "react";
import { ErrorCard } from "@/components/ErrorCard";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error("RootError:", error), [error]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorCard
        title="Something went wrong"
        message="This page ran into an unexpected error."
        details={`${error?.message ?? error}\n${error?.digest ? `\nDigest: ${error.digest}` : ""}`}
        onRetry={reset}
        href="/"
        hrefLabel="Go Home"
      />
    </div>
  );
}
