import { useMemoryDb } from "@/db";

export function DevBanner() {
  if (!useMemoryDb) return null;

  return (
    <div className="bg-yellow-500/15 border-b border-yellow-500/30 px-4 py-1.5 text-center text-xs text-yellow-400">
      In-memory mode — data resets on server restart. Set <code className="font-mono bg-yellow-500/20 px-1 rounded">DATABASE_URL</code> for persistence.
    </div>
  );
}
