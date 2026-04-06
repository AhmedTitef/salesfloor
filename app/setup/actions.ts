"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { hashPin } from "@/lib/auth";
import { useMemoryDb, getDb } from "@/db";
import { memoryDb } from "@/db/memory";
import * as schema from "@/db/schema";

const DEFAULT_ACTIVITY_TYPES = [
  { name: "Call", color: "#3B82F6", icon: "phone", sortOrder: 0 },
  { name: "Callback Booked", color: "#10B981", icon: "calendar-check", sortOrder: 1 },
  { name: "No Book", color: "#EF4444", icon: "x-circle", sortOrder: 2 },
  { name: "Raffle Sign-up", color: "#F59E0B", icon: "ticket", sortOrder: 3 },
  { name: "Inspection Booked", color: "#8B5CF6", icon: "home", sortOrder: 4 },
];

export async function createTeamAction(formData: FormData) {
  const name = formData.get("teamName") as string;
  const managerName = formData.get("managerName") as string;
  const pin = formData.get("pin") as string;
  const confirmPin = formData.get("confirmPin") as string;

  if (!name?.trim() || !managerName?.trim() || !pin || !confirmPin) {
    redirect("/setup?error=missing");
  }

  if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
    redirect("/setup?error=pin");
  }

  if (pin !== confirmPin) {
    redirect("/setup?error=mismatch");
  }

  if (useMemoryDb) {
    const team = memoryDb.createTeam({ name: name.trim(), pin: hashPin(pin), plainPin: pin });
    const manager = memoryDb.createUser({ teamId: team.id, name: managerName.trim(), role: "manager" });

    for (const at of DEFAULT_ACTIVITY_TYPES) {
      memoryDb.createActivityType({ teamId: team.id, ...at });
    }

    const cookieStore = await cookies();
    cookieStore.set("sf_session", JSON.stringify({
      userId: manager.id, teamId: team.id, role: "manager",
      userName: managerName.trim(), teamName: name.trim(), dailyGoal: team.dailyGoal,
    }), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    redirect("/dashboard");
  }

  // Drizzle DB path
  const db = getDb();
  const [team] = await db.insert(schema.teams).values({
    name: name.trim(),
    pin: hashPin(pin),
  }).returning();

  const [manager] = await db.insert(schema.users).values({
    teamId: team.id,
    name: managerName.trim(),
    role: "manager",
  }).returning();

  for (const at of DEFAULT_ACTIVITY_TYPES) {
    await db.insert(schema.activityTypes).values({
      teamId: team.id,
      ...at,
    });
  }

  const cookieStore = await cookies();
  cookieStore.set("sf_session", JSON.stringify({
    userId: manager.id, teamId: team.id, role: "manager",
    userName: managerName.trim(), teamName: name.trim(), dailyGoal: 50,
    iat: Date.now(),
  }), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}
