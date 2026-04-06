import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function POST(
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
  const { teamId } = await request.json();

  if (useMemoryDb) {
    const lt = memoryDb.addTeamToLeague(leagueId, teamId);
    return NextResponse.json({ leagueTeam: lt });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}

export async function DELETE(
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
  const { teamId } = await request.json();

  if (useMemoryDb) {
    memoryDb.removeTeamFromLeague(leagueId, teamId);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
