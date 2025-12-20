"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Container, Button } from "./ui";
import { cn } from "./utils";
import { Home, Upload, Sparkles, Clock, User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      setIsPro(Boolean(snap.data()?.isPro));
    });
  }, [user]);

  const nav = useMemo(
    () => [
      { href: "/app", label: "Overview", icon: Home },
      { href: "/app/upload", label: "Upload", icon: Upload },
      { href: "/app/analyze", label: "Analyze", icon: Sparkles },
      { href: "/app/timeline", label: "Timeline", icon: Clock },
      ...(isPro ? [] : [{ href: "/pricing", label: "Pricing", icon: ShieldCheck }]),
      { href: "/app/profile", label: "Profile", icon: User },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
    [isPro]
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10">
        <Container className="flex justify-between py-4">
          <Link href="/" className="font-black text-xl">DealAI</Link>
          <Button onClick={() => { signOut(); router.push("/login"); }}>
            <LogOut size={16} /> Logout
          </Button>
        </Container>
      </header>

      <Container className="grid grid-cols-[240px_1fr] gap-6 py-6">
        <aside className="space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2",
                  active && "bg-white/10"
                )}
              >
                <Icon size={18} />
                {n.label}
              </Link>
            );
          })}
        </aside>

        <main>{children}</main>
      </Container>
    </div>
  );
}
