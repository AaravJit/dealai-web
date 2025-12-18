"use client";

import { Card, Metric, Button } from "@/components/ui";
import { loadDB } from "@/lib/storage";

export default function AppHome() {
  const db = loadDB();

  const timelineCount = db.timeline.length;
  const feedCount = db.feed.length;

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-2xl font-black tracking-tight">Welcome to DealAI</div>
        <div className="mt-2 text-white/70">
          Upload a listing screenshot and get deal score + market price + negotiation text.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/app/upload">Upload Screenshot</Button>
          <Button href="/app/analyze" variant="secondary">Analyze (demo)</Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Saved to Timeline" value={`${timelineCount}`} />
        <Metric label="Posted to Community" value={`${feedCount}`} />
        <Metric label="Status" value="Frontend MVP" />
      </div>

      <Card>
        <div className="text-sm font-semibold">Next step (when you’re ready)</div>
        <div className="mt-2 text-sm text-white/70">
          Plug your analysis endpoint into <span className="text-white/85">/app/analyze</span> (replace the mock analyzer),
          then swap localStorage with Firebase.
        </div>
      </Card>
    </div>
  );
}
