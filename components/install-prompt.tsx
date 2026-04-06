"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if previously dismissed this session
    if (sessionStorage.getItem("sf_install_dismissed")) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("sf_install_dismissed", "1");
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-bounce-in">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-lg">
        <span className="text-2xl">&#9889;</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install SalesFloor</p>
          <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
