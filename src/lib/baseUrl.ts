export function getBaseUrlFromRequest(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (!host) {
    throw new Error("Missing Host header for base URL resolution");
  }
  return `${proto}://${host}`.replace(/\/+$/, "");
}

export function getEnvBaseUrl(): string | null {
  const fromNextPublic = process.env.NEXT_PUBLIC_APP_URL;
  if (fromNextPublic) return fromNextPublic.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return null;
}

export function safeNextPath(next?: string | null): string {
  if (!next) return "/app";
  try {
    if (next.startsWith("/")) return next;
    return "/app";
  } catch (error) {
    console.error("Invalid next path provided", { next, error });
    return "/app";
  }
}
