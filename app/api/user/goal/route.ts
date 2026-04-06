import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function PATCH(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = JSON.parse(raw);
  const { personalGoal, userId } = await request.json();

  // Manager can set for any rep, rep can set for themselves
  const targetId = session.role === "manager" && userId ? userId : session.userId;

  if (useMemoryDb) {
    const user = memoryDb.updateUser(targetId, { personalGoal: personalGoal || null });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: { id: user.id, personalGoal: user.personalGoal } });
  }

  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
