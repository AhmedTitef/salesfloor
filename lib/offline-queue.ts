// Offline activity queue — stores logs in localStorage, syncs when online

const QUEUE_KEY = "sf_offline_queue";

export interface QueuedActivity {
  activityTypeId: string;
  timestamp: number;
}

export function getQueue(): QueuedActivity[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushToQueue(item: QueuedActivity) {
  const queue = getQueue();
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.setItem(QUEUE_KEY, "[]");
}

export function removeFromQueue(index: number) {
  const queue = getQueue();
  queue.splice(index, 1);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueLength(): number {
  return getQueue().length;
}
