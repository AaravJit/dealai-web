"use client";

import { useEffect, useState } from "react";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { listTimeline, type DealResult } from "@/lib/dealsDb";

type TimelineDeal = DealResult & { id: string };

export default function TimelinePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<TimelineDeal[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    const data = (await listTimeline(user.uid)) as TimelineDeal[];
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [user]);

  if (!user) {
    return <Card>Please log in to view your timeline.</Card>;
  }

  if (loading) {
    return <Card>Loading timeline…</Card>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <div>No saved deals yet.</div>
        <Button href="/app/upload" className="mt-4">
          Upload a screenshot
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between">
          <div>
            <div className="text-2xl font-black">Timeline</div>
            <div className="text-sm text-white/70">Your saved deals</div>
          </div>
          <Button onClick={refresh} variant="secondary">
            Refresh
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((d) => {
          const reAnalyzeHref =
            `/app/analyze?` +
            new URLSearchParams({
              title: d.title,
              price: String(d.sellerPrice),
              loc: d.location ?? "",
            }).toString();

          return (
            <Card key={d.id} className="p-0 overflow-hidden">
              {d.imageUrl && (
                <img
                  src={d.imageUrl}
                  alt=""
                  className="h-48 w-full object-cover"
                />
              )}

              <div className="p-5">
                <div className="font-black">{d.title}</div>

                <div className="mt-2 flex gap-2 flex-wrap">
                  <Pill>Score {d.dealScore}</Pill>
                  <Pill>${d.sellerPrice.toLocaleString()}</Pill>
                  <Pill>MV ${d.marketValue.toLocaleString()}</Pill>
                </div>

                <Button
                  href={reAnalyzeHref}
                  variant="secondary"
                  className="mt-4"
                >
                  Re-analyze
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
