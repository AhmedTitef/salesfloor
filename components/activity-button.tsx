"use client";

import { useState } from "react";

const ICON_MAP: Record<string, string> = {
  phone: "\u{1F4DE}",
  "calendar-check": "\u{1F4C5}",
  "x-circle": "\u274C",
  ticket: "\u{1F3AB}",
  home: "\u{1F3E0}",
  star: "\u2B50",
  flag: "\u{1F6A9}",
  check: "\u2705",
  chat: "\u{1F4AC}",
  mail: "\u{1F4E7}",
};

interface ActivityButtonProps {
  name: string;
  color: string;
  icon: string;
  count: number;
  onTap: () => void;
  isLoading?: boolean;
}

export function ActivityButton({ name, color, icon, count, onTap, isLoading }: ActivityButtonProps) {
  const [animating, setAnimating] = useState(false);
  const [floats, setFloats] = useState<number[]>([]);

  function handleTap() {
    if (isLoading) return;
    setAnimating(true);
    setFloats((prev) => [...prev, Date.now()]);
    onTap();
    setTimeout(() => setAnimating(false), 150);
    // Clean up old floats
    setTimeout(() => setFloats((prev) => prev.slice(1)), 700);
  }

  const emoji = ICON_MAP[icon] || "\u{1F4CB}";

  return (
    <button
      onClick={handleTap}
      disabled={isLoading}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-4 transition-transform duration-150 active:scale-95 select-none min-h-[120px]"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}60`,
        transform: animating ? "scale(0.95)" : "scale(1)",
      }}
    >
      {/* Floating +1 animations */}
      {floats.map((id) => (
        <span
          key={id}
          className="absolute top-2 font-mono text-sm font-bold pointer-events-none animate-float-up"
          style={{ color }}
        >
          +1
        </span>
      ))}

      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-semibold text-foreground leading-tight text-center">{name}</span>
      <span
        className="font-mono text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {count}
      </span>
    </button>
  );
}
