"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyPin } from "@/lib/auth";
import { useMemoryDb, getDb } from "@/db";
import { memoryDb } from "@/db/memory";
import * as dbSchema from "@/db/schema";

export async function joinTeamAction(formData: FormData) {
  const name = formData.get("name") as string;
  const pin = formData.get("pin") as string;
  const email = (formData.get("email") as string)?.trim() || null;

  if (!name?.trim() || !pin) {
    redirect("/join?error=missing");
  }

  if (useMemoryDb) {
    const allTeams = memoryDb.getAllTeams();
    const team = allTeams.find((t) => verifyPin(pin, t.pin));

    if (!team) {
      redirect("/join?error=invalid");
    }

    const user = memoryDb.createUser({ teamId: team.id, name: name.trim(), email, role: "rep" });

    const cookieStore = await cookies();
    cookieStore.set("sf_session", JSON.stringify({
      userId: user.id, teamId: team.id, role: "rep",
      userName: name.trim(), teamName: team.name, dailyGoal: team.dailyGoal,
    }), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    redirect("/log");
  }

  // Drizzle path
  const db = getDb();
  const allTeams = await db.select().from(dbSchema.teams);
  const team = allTeams.find((t) => verifyPin(pin, t.pin));

  if (!team) {
    redirect("/join?error=invalid");
  }

  const [user] = await db.insert(dbSchema.users).values({
    teamId: team.id,
    name: name.trim(),
    email,
    role: "rep",
  }).returning();

  const cookieStore = await cookies();
  cookieStore.set("sf_session", JSON.stringify({
    userId: user.id, teamId: team.id, role: "rep",
    userName: name.trim(), teamName: team.name, dailyGoal: 50,
    iat: Date.now(),
  }), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/log");
}
