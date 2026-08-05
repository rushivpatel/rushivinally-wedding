"use client";

import { useCountdown } from "@/hooks/useCountdown";

const UNITS = [
  { label: "Days", key: "days" as const },
  { label: "Hours", key: "hours" as const },
  { label: "Minutes", key: "minutes" as const },
  { label: "Seconds", key: "seconds" as const },
];

export default function Countdown({ targetDate }: { targetDate: string }) {
  const countdown = useCountdown(targetDate);

  return (
    <div className="flex gap-3 sm:gap-3">
      {UNITS.map((unit) => (
        <div
          key={unit.key}
          className="liquid-glass-lite flex w-16 flex-col items-center rounded-2xl py-3 sm:w-20"
        >
          <span className="font-primary text-2xl text-primary sm:text-3xl">
            {countdown ? String(countdown[unit.key]).padStart(2, "0") : "--"}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-primary/70">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
