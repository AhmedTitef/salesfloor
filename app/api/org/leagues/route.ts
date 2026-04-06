import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId) return NextResponse.json({ error: "Not in an org" }, { status: 403 });

  if (useMemoryDb) {
    const leagues = memoryDb.getLeaguesByOrg(session.orgId);
    return NextResponse.json({ leagues });
  }
  return NextResponse.json({ leagues: [] });
}

export async function POST(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId || session.orgRole !== "org_admin") {
    return NextResponse.json({ error: "Org admin only" }, { status: 403 });
  }

  const { name, teamIds, durationDays, scoringMode } = await request.json();
  if (!name?.trim() || !teamIds?.length) {
    return NextResponse.json({ error: "Name and teams required" }, { status: 400 });
  }

  if (useMemoryDb) {
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + (durationDays || 7));

    const league = memoryDb.createLeague({
      orgId: session.orgId,
      name: name.trim(),
      startsAt: now,
      endsAt,
      scoringMode: scoringMode || "total",
    });

    for (const teamId of teamIds) {
      memoryDb.addTeamToLeague(league.id, teamId);
    }

    return NextResponse.json({ league });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
