import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId) return NextResponse.json({ error: "Not in an org" }, { status: 403 });

  const { leagueId } = await params;

  if (useMemoryDb) {
    const league = memoryDb.findLeagueById(leagueId);
    if (!league || league.orgId !== session.orgId) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }
    const standings = memoryDb.getLeagueStandings(leagueId);
    const teams = memoryDb.getLeagueTeams(leagueId);
    return NextResponse.json({ league, standings, teams: teams.map((t) => ({ id: t.id, name: t.name })) });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId || session.orgRole !== "org_admin") {
    return NextResponse.json({ error: "Org admin only" }, { status: 403 });
  }

  const { leagueId } = await params;

  if (useMemoryDb) {
    const league = memoryDb.findLeagueById(leagueId);
    if (!league || league.orgId !== session.orgId) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }
    const { isActive } = await request.json();
    if (typeof isActive === "boolean") league.isActive = isActive;
    if (!isActive) league.endsAt = new Date(); // End immediately
    return NextResponse.json({ league });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
