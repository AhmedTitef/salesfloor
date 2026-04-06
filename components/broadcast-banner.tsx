"use client";

import { useState, useEffect } from "react";

export function BroadcastBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBroadcast();
    const interval = setInterval(fetchBroadcast, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchBroadcast() {
    try {
      const res = await fetch("/api/broadcast");
      const data = await res.json();
      setMessage(data.broadcast?.message || null);
    } catch {}
  }

  if (!message) return null;

  return (
    <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-center text-sm text-blue-300">
      📣 {message}
    </div>
  );
}
