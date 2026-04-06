import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function POST(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);

  if (session.role !== "manager") {
    return NextResponse.json({ error: "Only managers can create organizations" }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Organization name required" }, { status: 400 });
  }

  if (useMemoryDb) {
    // Check if team already in an org
    const team = memoryDb.findTeamById(session.teamId);
    if (team?.orgId) {
      return NextResponse.json({ error: "Team already belongs to an organization" }, { status: 409 });
    }

    const org = memoryDb.createOrg({ name: name.trim() });
    memoryDb.addTeamToOrg(session.teamId, org.id);
    memoryDb.createOrgMember({ orgId: org.id, userId: session.userId, role: "org_admin" });

    // Update session cookie with org info
    const updatedSession = { ...session, orgId: org.id, orgRole: "org_admin" };
    const res = NextResponse.json({ org });
    res.cookies.set("sf_session", JSON.stringify({ ...updatedSession, iat: Date.now() }), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
