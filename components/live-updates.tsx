"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveUpdates() {
  const router = useRouter();

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/live");

      es.addEventListener("activity", () => {
        router.refresh();
      });

      es.onerror = () => {
        es?.close();
        // Reconnect after 5s
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
    };
  }, [router]);

  return null;
}
