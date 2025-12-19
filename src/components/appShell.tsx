"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Container, Button } from "./ui";
import { cn } from "./utils";
import { Home, Upload, Sparkles, Clock, User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { getUserProfile } from "@/lib/quota";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, signOut: signOutUser } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!user) return;
      try {
        const profile = await getUserProfile(user.uid);
        if (active) setIsPro(Boolean(profile?.isPro));
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [user]);

  const nav = useMemo(
    () => [
      { href: "/app", label: "Overview", icon: Home },
      { href: "/app/upload", label: "Upload", icon: Upload },
      { href: "/app/analyze", label: "Analyze", icon: Sparkles },
      { href: "/app/timeline", label: "Timeline", icon: Clock },
      ...(isPro ? [] : ([{ href: "/pricing", label: "Pricing", icon: ShieldCheck }] as const)),
      { href: "/app/profile", label: "Profile", icon: User },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
    [isPro]
  );

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOutUser();
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      router.push("/login");
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-180px] bottom-[-200px] h-[520px] w-[600px] rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060810]/80 backdrop-blur-xl">
        <Container>
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-500/10">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">DealAI</div>
                <div className="text-xs uppercase text-white/50">Private deals</div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white/90">{user?.displayName || "Member"}</div>
                  <div className="text-xs text-white/60">{user?.email}</div>
                </div>
                <div className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
                  {isPro ? "Pro" : "Free"}
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="border border-white/10 bg-white/5 px-3 py-2 text-sm"
                disabled={signingOut}
              >
                <LogOut size={16} /> {signingOut ? "Signing out" : "Logout"}
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container>
        <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[250px_1fr]">
          <aside className="glass rounded-2xl p-4 h-fit lg:sticky lg:top-[92px]">
            <div className="px-2 pb-2 text-[11px] uppercase tracking-[0.25em] text-white/50">Navigate</div>
            <nav className="flex flex-col gap-1">
              {nav.map((n) => {
                const active = path === n.href;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition border border-transparent hover:border-white/10 hover:bg-white/5",
                      active && "border-white/10 bg-white/10 shadow-inner shadow-cyan-500/10"
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn("transition", active ? "text-cyan-200" : "text-white/60 group-hover:text-white")}
                    />
                    <span className={cn(active ? "text-white" : "text-white/80")}>{n.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-sm font-semibold">Fast path</div>
              <div className="mt-1 text-xs text-white/60">
                Start with <span className="text-white/80">Upload</span>, then hit <span className="text-white/80">Analyze</span>.
              </div>
            </div>
          </aside>

          <main className="min-w-0 space-y-4">{children}</main>
        </div>
      </Container>
    </div>
  );
}
