"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({ length = 6, value, onChange, disabled, className }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function applyDigits(startIndex: number, digits: string) {
    const chars = value.padEnd(length, " ").split("");
    for (let i = 0; i < digits.length && startIndex + i < length; i++) {
      chars[startIndex + i] = digits[i];
    }
    onChange(chars.join("").trimEnd().slice(0, length));
    const nextIndex = Math.min(startIndex + digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      const chars = value.split("");
      chars[index] = "";
      onChange(chars.join(""));
      return;
    }
    applyDigits(index, raw);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    applyDigits(index, pasted);
  }

  return (
    <div className={cn("flex justify-center gap-2.5", className)} role="group" aria-label="Verification code">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${length}`}
          value={value[i] ?? ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          // Flexible rather than fixed-width: a definite width makes each box's
          // flex minimum size that width, so six of them plus gaps overflow a
          // max-w-sm card and get clipped flush to its edges. min-w-0 lifts
          // that floor, and the cap keeps them from stretching on wide cards.
          className="h-14 min-w-0 flex-1 max-w-14 rounded-xl border border-border bg-muted/50 text-center text-xl font-bold text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 sm:h-16 sm:text-2xl"
        />
      ))}
    </div>
  );
}
