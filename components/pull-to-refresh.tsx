"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export function PullToRefresh() {
  const router = useRouter();
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);

  const handleRefresh = useCallback(() => {
    setPulling(true);
    router.refresh();
    setTimeout(() => setPulling(false), 1000);
  }, [router]);

  useEffect(() => {
    let touchStartY = 0;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (startY.current === 0) return;
      const diff = e.changedTouches[0].clientY - startY.current;
      if (diff > 80 && window.scrollY === 0) {
        handleRefresh();
      }
      startY.current = 0;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleRefresh]);

  if (!pulling) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-2">
      <div className="text-xs text-muted-foreground animate-pulse">Refreshing...</div>
    </div>
  );
}
