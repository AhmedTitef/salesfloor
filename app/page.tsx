import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-8 text-center max-w-sm w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">&#9889;</div>
          <h1 className="text-4xl font-bold tracking-tight">SalesFloor</h1>
          <p className="text-lg text-muted-foreground font-medium">
            Log. Track. Win.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/join"
            className="inline-flex h-14 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-semibold w-full transition-all hover:bg-primary/80"
          >
            Join Your Team
          </Link>
          <Link
            href="/setup"
            className="inline-flex h-14 items-center justify-center rounded-lg border border-border bg-background text-foreground text-lg font-semibold w-full transition-all hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
          >
            Create a Team
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Built for the floor. Fast taps, real-time stats.
        </p>

        <div className="flex gap-4 text-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">👆</span>
            <span>One-tap logging</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">🏆</span>
            <span>Leaderboards</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">🔥</span>
            <span>Streaks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
