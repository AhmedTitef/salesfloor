import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import * as queries from "@/db/queries";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await queries.getUserProfile(session.userId);
  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const targetUserId = session.role === "manager" && body.targetUserId ? body.targetUserId : session.userId;

  // If manager editing another user, verify they're on the same team
  if (targetUserId !== session.userId && session.role !== "manager") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updates: { name?: string; personalGoal?: number | null; daysOff?: string | null } = {};

  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }
  if (body.personalGoal === null || (typeof body.personalGoal === "number" && body.personalGoal >= 1 && body.personalGoal <= 999)) {
    updates.personalGoal = body.personalGoal;
  }
  if (typeof body.daysOff === "string" || body.daysOff === null) {
    updates.daysOff = body.daysOff;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await queries.updateUserProfile(targetUserId, updates);

  // If updating own name, refresh session cookie
  if (updates.name && targetUserId === session.userId) {
    const updatedSession = { ...session, userName: updates.name, iat: Date.now() };
    const res = NextResponse.json({ success: true });
    res.cookies.set("sf_session", JSON.stringify(updatedSession), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.json({ success: true });
}
