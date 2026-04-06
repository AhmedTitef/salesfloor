import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId) return NextResponse.json({ error: "Not in an org" }, { status: 403 });

  if (useMemoryDb) {
    const members = memoryDb.getOrgMembers(session.orgId);
    const enriched = members.map((m) => {
      const user = memoryDb.findUserById(m.userId);
      return { id: m.id, userId: m.userId, userName: user?.name || "Unknown", role: m.role };
    });
    return NextResponse.json({ members: enriched });
  }
  return NextResponse.json({ members: [] });
}

export async function POST(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (!session.orgId || session.orgRole !== "org_admin") {
    return NextResponse.json({ error: "Org admin only" }, { status: 403 });
  }

  const { userId, role } = await request.json();
  if (!userId || !["org_admin", "org_viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  if (useMemoryDb) {
    const member = memoryDb.createOrgMember({ orgId: session.orgId, userId, role });
    return NextResponse.json({ member });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
