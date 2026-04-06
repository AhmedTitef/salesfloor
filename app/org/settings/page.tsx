"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrgTeam { id: string; name: string; repCount: number }

export default function OrgSettingsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<OrgTeam[]>([]);
  const [orgName, setOrgName] = useState("");
  const [invitePin, setInvitePin] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((d) => {
        if (!d.org) { router.push("/dashboard"); return; }
        setOrgName(d.org.name);
      });
    fetchTeams();
  }, [router]);

  function fetchTeams() {
    fetch("/api/org/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []));
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!invitePin.trim()) return;
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/org/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: invitePin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "Failed"); return; }
      setInvitePin("");
      fetchTeams();
    } catch {
      setAddError("Something went wrong");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveTeam(teamId: string) {
    await fetch("/api/org/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    fetchTeams();
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{orgName || "Organization"}</h1>
          <p className="text-xs text-muted-foreground">Org Settings</p>
        </div>
        <div className="flex gap-3">
          <Link href="/org/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
            Org Dashboard
          </Link>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
            Team
          </Link>
        </div>
      </div>

      {/* Teams in org */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Teams ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No teams yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {teams.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <span className="flex-1 text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.repCount} reps</span>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => handleRemoveTeam(t.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add team by PIN */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Team</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Enter a team&apos;s PIN to add them to your organization.
          </p>
          <form onSubmit={handleAddTeam} className="flex items-center gap-2">
            <Input
              placeholder="Team PIN"
              value={invitePin}
              onChange={(e) => setInvitePin(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={addLoading}>
              {addLoading ? "Adding..." : "Add"}
            </Button>
          </form>
          {addError && <p className="text-xs text-destructive mt-2">{addError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
