"use client";

import { AppShell } from "@/components/appShell";
import { useAuth } from "@/components/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setReady(false);

      // Auth still loading in your provider (common pattern)
      // If your useAuth never returns undefined, this just runs normally.
      if (user === undefined) return;

      const next = pathname ?? "/app";

      // Not signed in → go to purchase (purchase lets them sign up/sign in)
      if (!user) {
        router.replace(`/purchase?next=${encodeURIComponent(next)}`);
        return;
      }

      // Signed in → check paid flag
      const snap = await getDoc(doc(db, "users", user.uid));
      const isPro = snap.exists() ? !!(snap.data() as any).isPro : false;

      if (!isPro) {
        router.replace(`/purchase?next=${encodeURIComponent(next)}`);
        return;
      }

      if (!cancelled) setReady(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user, router, pathname]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="p-6">
          <div className="text-2xl font-black tracking-tight">Checking access…</div>
          <div className="mt-2 text-white/70 text-sm">
            Verifying your account and subscription.
          </div>
        </Card>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
