"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QRCodeSVG } from "qrcode.react";

interface SessionData {
  userId: string;
  userName: string;
  role: string;
  teamId: string;
  teamName: string;
  teamPin: string;
  dailyGoal: number;
  orgId?: string;
  orgRole?: string;
}

interface ActivityType {
  id: string;
  name: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

const EMOJI_OPTIONS = [
  { value: "phone", emoji: "📞" },
  { value: "calendar-check", emoji: "📅" },
  { value: "x-circle", emoji: "❌" },
  { value: "ticket", emoji: "🎫" },
  { value: "home", emoji: "🏠" },
  { value: "star", emoji: "⭐" },
  { value: "flag", emoji: "🚩" },
  { value: "check", emoji: "✅" },
  { value: "chat", emoji: "💬" },
  { value: "mail", emoji: "📧" },
  { value: "handshake", emoji: "🤝" },
  { value: "money", emoji: "💰" },
  { value: "rocket", emoji: "🚀" },
  { value: "fire", emoji: "🔥" },
  { value: "target", emoji: "🎯" },
  { value: "trophy", emoji: "🏆" },
  { value: "chart", emoji: "📊" },
  { value: "clock", emoji: "⏰" },
  { value: "car", emoji: "🚗" },
  { value: "door", emoji: "🚪" },
  { value: "clipboard", emoji: "📋" },
  { value: "megaphone", emoji: "📣" },
  { value: "gift", emoji: "🎁" },
  { value: "thumbsup", emoji: "👍" },
];

const COLOR_OPTIONS = [
  "#3B82F6",
  "#10B981",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [showPin, setShowPin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Goal
  const [goalValue, setGoalValue] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);

  // Challenge
  const [challengeName, setChallengeName] = useState("");
  const [challengeDuration, setChallengeDuration] = useState("60");
  const [challengeCreating, setChallengeCreating] = useState(false);
  const [challengeMsg, setChallengeMsg] = useState("");

  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  // New activity type form
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [newIcon, setNewIcon] = useState("star");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== "manager") {
          router.push("/");
          return;
        }
        setSession(data.session);
        setGoalValue(String(data.session.dailyGoal || 50));
      })
      .catch(() => router.push("/"));
  }, [router]);

  useEffect(() => {
    if (!session) return;
    fetchTypes();
  }, [session]);

  function fetchTypes() {
    fetch("/api/activity-types")
      .then((res) => res.json())
      .then((data) => setActivityTypes(data.activityTypes || []));
  }

  async function toggleActive(at: ActivityType) {
    await fetch("/api/activity-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: at.id, is_active: !at.isActive }),
    });
    fetchTypes();
  }

  async function handleAddType(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");

    if (!newName.trim()) {
      setAddError("Name is required.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch("/api/activity-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor, icon: newIcon }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAddError(data.error || "Failed to add.");
        return;
      }
      setNewName("");
      setNewIcon("star");
      fetchTypes();
    } catch {
      setAddError("Something went wrong.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/");
  }

  async function handleSaveGoal() {
    const num = parseInt(goalValue);
    if (isNaN(num) || num < 1 || num > 999) return;
    await fetch("/api/team/goal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyGoal: num }),
    });
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2000);
  }

  async function handleCreateChallenge() {
    if (!challengeName.trim()) return;
    setChallengeCreating(true);
    setChallengeMsg("");
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: challengeName.trim(), durationMinutes: parseInt(challengeDuration) || 60 }),
      });
      if (!res.ok) {
        const d = await res.json();
        setChallengeMsg(d.error || "Failed");
      } else {
        setChallengeMsg("Challenge started!");
        setChallengeName("");
      }
    } catch {
      setChallengeMsg("Error creating challenge");
    } finally {
      setChallengeCreating(false);
    }
  }

  async function handleBroadcast() {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg.trim() }),
      });
      setBroadcastSent(true);
      setBroadcastMsg("");
      setTimeout(() => setBroadcastSent(false), 2000);
    } catch {} finally {
      setBroadcastSending(false);
    }
  }

  async function handleSaveWebhook() {
    await fetch("/api/team/goal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl }),
    });
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  }

  function handleCopyPin() {
    if (!session) return;
    navigator.clipboard.writeText(session.teamPin).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!session) return null;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground">{session.teamName}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
            Dashboard
          </Link>
          <Link href="/log" className="text-xs text-muted-foreground hover:text-foreground underline">
            Log
          </Link>
        </div>
      </div>

      {/* Organization */}
      {session && !session.teamPin ? null : (
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            {session?.orgId ? (
              <Link href="/org/dashboard" className="text-sm font-semibold text-primary hover:underline">
                View Org Dashboard &rarr;
              </Link>
            ) : (
              <Link href="/org/create" className="text-sm font-semibold text-primary hover:underline">
                Create an Organization &rarr;
              </Link>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {session?.orgId ? "Manage your multi-team organization" : "Group multiple teams, see rollup stats, run leagues"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Team PIN */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team PIN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg tracking-widest">
              {showPin ? session.teamPin.slice(0, 6) : "\u2022\u2022\u2022\u2022"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowPin(!showPin)}>
              {showPin ? "Hide" : "Show"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopyPin}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
              {showQR ? "Hide QR" : "Show QR Code"}
            </Button>
          </div>
          {showQR && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/join?pin=${session.teamPin}`}
                  size={180}
                />
              </div>
              <p className="text-xs text-muted-foreground">Reps scan to join instantly</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Share this PIN or QR code with your reps so they can join.
          </p>
        </CardContent>
      </Card>

      {/* Daily Goal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily Team Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Set a daily activity target for the whole team. Reps see progress and celebrate when it&apos;s hit.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={999}
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">activities/day</span>
            <Button size="sm" onClick={handleSaveGoal}>
              {goalSaved ? "Saved!" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Challenge */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Start a timed sprint. Reps see a countdown and mini-leaderboard.
          </p>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="e.g. Callback Blitz"
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <select
                value={challengeDuration}
                onChange={(e) => setChallengeDuration(e.target.value)}
                className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
              <Button size="sm" onClick={handleCreateChallenge} disabled={challengeCreating}>
                {challengeCreating ? "Starting..." : "Start Challenge"}
              </Button>
            </div>
            {challengeMsg && <p className="text-xs text-muted-foreground">{challengeMsg}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Message */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Broadcast Message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Send a message that appears on all reps&apos; log pages.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="e.g. 2pm-4pm callback blitz!"
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
            />
            <Button size="sm" onClick={handleBroadcast} disabled={broadcastSending}>
              {broadcastSent ? "Sent!" : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Webhook</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Send a POST request on every activity log. Works with Zapier, Make, or any URL.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="https://hooks.zapier.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <Button size="sm" onClick={handleSaveWebhook}>
              {webhookSaved ? "Saved!" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Types List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {activityTypes.map((at) => (
              <div
                key={at.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: at.color }}
                />
                <span className="flex-1 text-sm font-medium truncate">{at.name}</span>
                <Badge variant={at.isActive ? "default" : "secondary"} className="text-[10px]">
                  {at.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => toggleActive(at)}
                >
                  {at.isActive ? "Disable" : "Enable"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add new activity type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Activity Type</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddType} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="atName">Name</Label>
              <Input
                id="atName"
                placeholder="e.g. Demo Booked"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? "white" : "transparent",
                      transform: newColor === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Icon</Label>
              <div className="flex gap-1.5 flex-wrap">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => setNewIcon(e.value)}
                    className={`w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition-all ${
                      newIcon === e.value
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {e.emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  placeholder="Or type any emoji..."
                  value={EMOJI_OPTIONS.find(e => e.value === newIcon) ? "" : newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {addError && <p className="text-sm text-destructive">{addError}</p>}

            <Button type="submit" disabled={addLoading}>
              {addLoading ? "Adding..." : "Add Type"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Logout */}
      <Button variant="destructive" onClick={handleLogout} className="w-full">
        Log Out
      </Button>
    </div>
  );
}
