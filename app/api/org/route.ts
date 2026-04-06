import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);

  if (useMemoryDb) {
    const orgInfo = memoryDb.getOrgForUser(session.userId);
    if (!orgInfo) return NextResponse.json({ org: null });
    const teams = memoryDb.getOrgTeams(orgInfo.org.id);
    return NextResponse.json({ org: orgInfo.org, role: orgInfo.role, teamCount: teams.length });
  }

  return NextResponse.json({ org: null });
}
