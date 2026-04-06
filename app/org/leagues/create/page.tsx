"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrgTeam { id: string; name: string; repCount: number }

export default function CreateLeaguePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<OrgTeam[]>([]);
  const [name, setName] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState("7");
  const [scoringMode, setScoringMode] = useState("total");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/org/teams")
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.teams || []);
        // Select all teams by default
        setSelectedTeams(new Set((d.teams || []).map((t: OrgTeam) => t.id)));
      });
  }, []);

  function toggleTeam(id: string) {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || selectedTeams.size < 2) {
      setError("Need a name and at least 2 teams");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/org/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          teamIds: Array.from(selectedTeams),
          durationDays: parseInt(duration),
          scoringMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      router.push(`/org/leagues/${data.league.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Create League</h1>
        <Link href="/org/leagues" className="text-xs text-muted-foreground hover:text-foreground underline">
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              placeholder="e.g. March Madness"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="flex gap-3">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="3">3 days</option>
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month</option>
              </select>
              <select
                value={scoringMode}
                onChange={(e) => setScoringMode(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="total">Total activities</option>
                <option value="per_rep_avg">Per-rep average</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Teams ({selectedTeams.size} selected)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {teams.map((t) => (
                <label key={t.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={selectedTeams.has(t.id)}
                    onChange={() => toggleTeam(t.id)}
                    className="rounded"
                  />
                  <span className="flex-1 text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.repCount} reps</span>
                </label>
              ))}
              {teams.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No teams in org yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Start League"}
        </Button>
      </form>
    </div>
  );
}
