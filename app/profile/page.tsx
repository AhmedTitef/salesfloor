"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [personalGoal, setPersonalGoal] = useState("");
  const [daysOff, setDaysOff] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) { router.push("/"); return; }
        setName(d.profile.name || "");
        setPersonalGoal(d.profile.personalGoal ? String(d.profile.personalGoal) : "");
        if (d.profile.daysOff) {
          setDaysOff(new Set(d.profile.daysOff.split(",").map(Number).filter((n: number) => !isNaN(n))));
        }
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [router]);

  function toggleDay(day: number) {
    setDaysOff((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || undefined,
        personalGoal: personalGoal ? parseInt(personalGoal) : null,
        daysOff: daysOff.size > 0 ? Array.from(daysOff).sort().join(",") : null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/");
  }

  if (loading) return null;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Profile</h1>
          <p className="text-xs text-muted-foreground">Your settings</p>
        </div>
        <Link href="/log" className="text-xs text-muted-foreground hover:text-foreground underline">
          Back to Log
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Set your own daily target. Leave empty to use the team goal.
          </p>
          <Input
            type="number"
            min={1}
            max={999}
            value={personalGoal}
            onChange={(e) => setPersonalGoal(e.target.value)}
            placeholder="Use team goal"
            className="w-32"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Days Off</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Select your days off. Streaks won&apos;t break on these days.
          </p>
          <div className="flex gap-2">
            {DAYS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                  daysOff.has(i)
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saved ? "Saved!" : saving ? "Saving..." : "Save Profile"}
      </Button>

      <Button variant="destructive" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
  );
}
