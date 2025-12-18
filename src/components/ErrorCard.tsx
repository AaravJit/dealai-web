"use client";

import { Button, Card } from "@/components/ui";

export function ErrorCard({
  title = "Something went wrong",
  message = "An unexpected error happened.",
  details,
  onRetry,
  href = "/app",
  hrefLabel = "Back to App",
}: {
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <Card>
      <div className="text-2xl font-black tracking-tight">{title}</div>
      <div className="mt-2 text-white/70 text-sm">{message}</div>

      {details ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
          {details}
        </pre>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
        <Button href={href} variant="ghost">
          {hrefLabel} →
        </Button>
      </div>
    </Card>
  );
}
