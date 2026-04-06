import { NextRequest, NextResponse } from "next/server";
import * as queries from "@/db/queries";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
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
    case "all":
      start = new Date(0);
      break;
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
  }

  const logs = await queries.getActivityLogs(session.teamId, { start, limit: 10000 });

  // Build CSV
  const header = "Date,Time,Rep,Activity,Outcome";
  const rows = logs.map((log) => {
    const d = new Date(log.createdAt);
    const date = d.toLocaleDateString("en-US");
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const outcome = "outcome" in log ? (log.outcome || "") : "";
    return `${date},${time},"${log.userName}","${log.activityTypeName}",${outcome}`;
  });

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="salesfloor-export-${period}.csv"`,
    },
  });
}
