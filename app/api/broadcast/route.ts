import { NextRequest, NextResponse } from "next/server";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);

  if (useMemoryDb) {
    const broadcast = memoryDb.getActiveBroadcast(session.teamId);
    return NextResponse.json({ broadcast: broadcast || null });
  }
  return NextResponse.json({ broadcast: null });
}

export async function POST(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = JSON.parse(raw);
  if (session.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const { message } = await request.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  if (useMemoryDb) {
    const broadcast = memoryDb.createBroadcast({ teamId: session.teamId, message: message.trim() });
    return NextResponse.json({ broadcast });
  }
  return NextResponse.json({ error: "No DB" }, { status: 500 });
}
