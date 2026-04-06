"use client";

import { useEffect, useState } from "react";

interface ConfettiProps {
  messages: string[];
}

export function Confetti({ messages }: ConfettiProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [messages]);

  if (!visible || messages.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <span
            key={i}
            className="confetti-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"][i % 6],
            }}
          />
        ))}
      </div>
      {/* Toast messages */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl px-5 py-3 shadow-lg text-sm font-bold text-center animate-bounce-in pointer-events-auto"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
