"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { loadDB, saveDB } from "@/lib/storage";

export default function ProfilePage() {
  const initial = loadDB();
  const [handle, setHandle] = useState(initial.profile.handle);
  const [bio, setBio] = useState(initial.profile.bio);

  function save() {
    const db = loadDB();
    db.profile.handle = handle.trim() || "user";
    db.profile.bio = bio.trim();
    saveDB(db);
    alert("Saved ✅");
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-2xl font-black tracking-tight">Profile</div>
        <div className="mt-2 text-sm text-white/70">Local profile for now.</div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="text-xs text-white/60">Handle</div>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-cyan-300/30"
            />
          </label>

          <label className="block">
            <div className="text-xs text-white/60">Bio</div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-cyan-300/30"
            />
          </label>

          <Button onClick={save}>Save Profile</Button>
        </div>
      </Card>
    </div>
  );
}
