"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function SensitiveValue({ value, masked }: { value: string; masked?: boolean }) {
  const [revealed, setRevealed] = useState(!masked);
  if (!masked) return <span>{value}</span>;
  const display = value.includes("•") ? value : `••••••${value.slice(-4)}`;
  return (
    <span className="sensitive-value">
      <span aria-live="polite">{revealed ? value : display}</span>
      <button type="button" onClick={() => setRevealed((current) => !current)} aria-label={`${revealed ? "Hide" : "Reveal"} sensitive value`}>
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </span>
  );
}
