"use client";

import { AppShell } from "@/components/appShell";
import { useAuth } from "@/components/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (loading) return;

      const next = pathname ?? "/app";

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      const isPro = snap.exists() ? Boolean((snap.data() as any).isPro) : false;

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
  }, [user, loading, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-6">Loading…</Card>
        </motion.div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
