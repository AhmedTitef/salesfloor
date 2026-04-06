"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL = 15000; // 15 seconds

export function LiveUpdates() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
