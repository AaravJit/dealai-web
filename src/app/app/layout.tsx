"use client";

import { AppShell } from "@/components/appShell";
import { useAuth } from "@/components/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui";
import { motion } from "framer-motion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const next = pathname ?? "/app";
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [user, router, pathname, loading]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <Card className="glow rounded-3xl p-8">
            <div className="h-4 w-44 rounded-full bg-white/10 animate-pulse" />
            <div className="mt-3 h-3 w-72 rounded-full bg-white/5 animate-pulse" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-10 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-10 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
