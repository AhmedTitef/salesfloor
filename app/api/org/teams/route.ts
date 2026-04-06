import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";
import { verifyPin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId) return NextResponse.json({ error: "Not in an org" }, { status: 403 });

  if (useMemoryDb) {
    const teams = memoryDb.getOrgTeams(session.orgId);
    return NextResponse.json({
      teams: teams.map((t) => ({ id: t.id, name: t.name, repCount: memoryDb.getUsersByTeam(t.id).filter((u) => u.role === "rep").length })),
    });
  }
  return NextResponse.json({ teams: [] });
}

export async function POST(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId || session.orgRole !== "org_admin") {
    return NextResponse.json({ error: "Org admin only" }, { status: 403 });
  }

  const { pin } = await request.json();
  if (!pin) return NextResponse.json({ error: "Team PIN required" }, { status: 400 });

  if (useMemoryDb) {
    const allTeams = memoryDb.getAllTeams();
    const team = allTeams.find((t) => verifyPin(pin, t.pin));
    if (!team) return NextResponse.json({ error: "Invalid PIN" }, { status: 404 });
    if (team.orgId) return NextResponse.json({ error: "Team already in an org" }, { status: 409 });

    memoryDb.addTeamToOrg(team.id, session.orgId);
    return NextResponse.json({ team: { id: team.id, name: team.name } });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}

export async function DELETE(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId || session.orgRole !== "org_admin") {
    return NextResponse.json({ error: "Org admin only" }, { status: 403 });
  }

  const { teamId } = await request.json();
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  if (useMemoryDb) {
    memoryDb.removeTeamFromOrg(teamId);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
