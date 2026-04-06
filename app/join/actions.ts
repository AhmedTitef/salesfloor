"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyPin } from "@/lib/auth";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

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

  redirect("/log");
}
