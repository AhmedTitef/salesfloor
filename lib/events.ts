// Simple event emitter for SSE — tracks connected clients per team

type Listener = (data: string) => void;

const g = globalThis as typeof globalThis & {
  __sf_listeners?: Map<string, Set<Listener>>;
};
g.__sf_listeners ??= new Map();

const listeners = g.__sf_listeners;

export function addListener(teamId: string, fn: Listener) {
  if (!listeners.has(teamId)) listeners.set(teamId, new Set());
  listeners.get(teamId)!.add(fn);
}

export function removeListener(teamId: string, fn: Listener) {
  listeners.get(teamId)?.delete(fn);
  if (listeners.get(teamId)?.size === 0) listeners.delete(teamId);
}

export function emitToTeam(teamId: string, event: string, data?: Record<string, unknown>) {
  const fns = listeners.get(teamId);
  if (!fns) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data || {})}\n\n`;
  for (const fn of fns) {
    fn(payload);
  }
}
