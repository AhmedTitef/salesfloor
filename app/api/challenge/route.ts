import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);

  if (useMemoryDb) {
    const challenge = memoryDb.getActiveChallenge(session.teamId);
    if (!challenge) return NextResponse.json({ challenge: null });
    const leaderboard = memoryDb.getChallengeLeaderboard(session.teamId, challenge.id);
    return NextResponse.json({ challenge, leaderboard });
  }

  return NextResponse.json({ challenge: null });
}

export async function POST(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (session.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const { name, durationMinutes } = await request.json();
  if (!name || !durationMinutes) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (useMemoryDb) {
    const existing = memoryDb.getActiveChallenge(session.teamId);
    if (existing) {
      return NextResponse.json({ error: "A challenge is already active" }, { status: 409 });
    }
    const challenge = memoryDb.createChallenge({
      teamId: session.teamId,
      name,
      durationMinutes: Math.min(480, Math.max(5, durationMinutes)),
    });
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
