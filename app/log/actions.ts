"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";
import * as queries from "@/db/queries";
import { emitToTeam } from "@/lib/events";

export async function logActivityAction(formData: FormData) {
  const activityTypeId = formData.get("activityTypeId") as string;
  if (!activityTypeId) return { error: "Missing activity type" };

  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return { error: "Not authenticated" };

  const session = JSON.parse(raw);

  const log = await queries.createActivityLog({
    userId: session.userId,
    teamId: session.teamId,
    activityTypeId,
  });

  if (useMemoryDb) {
    const at = memoryDb.findActivityTypeById(activityTypeId);
    memoryDb.addAuditEntry({
      teamId: session.teamId, userId: session.userId, userName: session.userName,
      action: "activity.logged", detail: at?.name || activityTypeId,
    });
    const team = memoryDb.findTeamById(session.teamId);
    if (team?.webhookUrl) {
      fetch(team.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "activity.logged",
          data: { logId: log.id, userName: session.userName, activityType: at?.name, teamName: team.name, timestamp: new Date().toISOString() },
        }),
      }).catch(() => {});
    }
  }

  emitToTeam(session.teamId, "activity", { userName: session.userName });
  revalidatePath("/log");
  return { logId: log.id };
}

export async function tagOutcomeAction(logId: string, outcome: "won" | "lost" | "pending" | null) {
  if (!logId) return;

  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return;

  const session = JSON.parse(raw);

  if (useMemoryDb) {
    memoryDb.updateActivityLog(logId, session.userId, { outcome });
  }

  revalidatePath("/log");
}

export async function undoActivityAction(logId: string) {
  if (!logId) return;

  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return;

  const session = JSON.parse(raw);

  await queries.deleteActivityLog(logId, session.userId);

  if (useMemoryDb) {
    memoryDb.addAuditEntry({
      teamId: session.teamId, userId: session.userId, userName: session.userName,
      action: "activity.undone", detail: logId,
    });
  }

  revalidatePath("/log");
}
