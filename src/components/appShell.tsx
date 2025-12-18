"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./ui";
import { cn } from "./utils";
import { Home, Upload, Sparkles, Clock, Users, User, Settings } from "lucide-react";

const nav = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/upload", label: "Upload", icon: Upload },
  { href: "/app/analyze", label: "Analyze", icon: Sparkles },
  { href: "/app/timeline", label: "Timeline", icon: Clock },
  { href: "/app/profile", label: "Profile", icon: User },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-120px] h-[380px] w-[780px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-120px] bottom-[-180px] h-[420px] w-[520px] rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/60 backdrop-blur">
        <Container>
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-cyan-400/20 border border-cyan-300/25" />
              <div className="font-black tracking-tight">DealAI</div>
              <span className="text-xs text-white/50">web</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/pricing" className="text-sm text-white/70 hover:text-white">Pricing</Link>
              <Link href="/app/upload" className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold border border-white/10 hover:bg-white/15">
                Open App
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <Container>
        <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-[240px_1fr]">
          <aside className="glass rounded-2xl p-3 h-fit md:sticky md:top-[88px]">
            <div className="px-3 py-2 text-xs uppercase tracking-widest text-white/40">Navigation</div>
            <nav className="flex flex-col">
              {nav.map((n) => {
                const active = path === n.href;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm border border-transparent hover:bg-white/5",
                      active && "bg-white/7 border-white/10"
                    )}
                  >
                    <Icon size={18} className={cn(active ? "text-cyan-200" : "text-white/60")} />
                    <span className={cn(active ? "text-white" : "text-white/80")}>{n.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-sm font-semibold">Tip</div>
              <div className="mt-1 text-xs text-white/60">
                Start with <span className="text-white/80">Upload</span>, then hit <span className="text-white/80">Analyze</span>.
              </div>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </Container>
    </div>
  );
}
