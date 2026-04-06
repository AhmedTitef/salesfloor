import Link from "next/link";
import { createTeamAction } from "./actions";

export default function SetupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-bold mb-1">Create a Team</h1>
        <p className="text-sm text-muted-foreground mb-6">Set up your team and start tracking.</p>

        <form action={createTeamAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="teamName" className="text-sm font-medium">Team Name</label>
            <input id="teamName" name="teamName" placeholder="e.g. HD West Region" required
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-base placeholder:text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="managerName" className="text-sm font-medium">Your Name</label>
            <input id="managerName" name="managerName" placeholder="e.g. Alex" required
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-base placeholder:text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="pin" className="text-sm font-medium">Team PIN (4-6 digits)</label>
            <input id="pin" name="pin" type="password" inputMode="numeric" maxLength={6} placeholder="••••" required
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-base placeholder:text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPin" className="text-sm font-medium">Confirm PIN</label>
            <input id="confirmPin" name="confirmPin" type="password" inputMode="numeric" maxLength={6} placeholder="••••" required
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-base placeholder:text-muted-foreground" />
          </div>

          <button type="submit"
            className="h-12 rounded-lg bg-primary text-primary-foreground text-base font-semibold">
            Create Team
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have a team?{" "}
            <Link href="/join" className="underline text-foreground">Join instead</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
