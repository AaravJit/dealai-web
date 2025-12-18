import Link from "next/link";
import { cn } from "./utils";

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4">{children}</div>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("glass glow rounded-2xl p-5", className)}>{children}</div>;
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-cyan-500/20 text-cyan-100 border border-cyan-400/30 hover:bg-cyan-500/25"
      : variant === "secondary"
      ? "bg-white/10 text-white border border-white/10 hover:bg-white/15"
      : variant === "danger"
      ? "bg-rose-500/15 text-rose-100 border border-rose-400/25 hover:bg-rose-500/20"
      : "bg-transparent text-white/80 hover:text-white hover:bg-white/5";

  if (href) {
    return (
      <Link href={href} className={cn(base, styles, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cn(base, styles, className)} disabled={disabled}>
      {children}
    </button>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{children}</span>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 border border-white/10">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
