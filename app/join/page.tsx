import Link from "next/link";
import { joinTeamAction } from "./actions";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const { pin } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-bold mb-1">Join Your Team</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your name and team PIN to start logging.</p>

        <form action={joinTeamAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">Your Name</label>
            <input id="name" name="name" placeholder="e.g. Jordan" required
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-base placeholder:text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">Email <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input id="email" name="email" type="email" placeholder="for account recovery"
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-base placeholder:text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="pin" className="text-sm font-medium">Team PIN</label>
            <input id="pin" name="pin" type="password" inputMode="numeric" maxLength={6} placeholder="••••" required
              defaultValue={pin || ""}
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-base placeholder:text-muted-foreground" />
            {pin && <p className="text-xs text-green-500">PIN pre-filled from QR code</p>}
          </div>

          <button type="submit"
            className="h-12 rounded-lg bg-primary text-primary-foreground text-base font-semibold">
            Join Team
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Need to create a team?{" "}
            <Link href="/setup" className="underline text-foreground">Set one up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
