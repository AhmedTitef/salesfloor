import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId || !session.orgRole) {
    return NextResponse.json({ error: "Not in an org" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "today";

  const now = new Date();
  let start: Date;
  switch (period) {
    case "week": {
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
  }

  if (useMemoryDb) {
    const stats = memoryDb.getOrgStats(session.orgId, start, now);
    return NextResponse.json(stats);
  }

  return NextResponse.json({ perTeam: [], topReps: [], totalActivities: 0, teamCount: 0 });
}
