"use client";

import * as React from "react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export interface MonthYearValue {
  month: number; // 1–12
  year: number;
}

interface MonthYearPickerProps {
  value?: MonthYearValue;
  onChange?: (value: MonthYearValue) => void;
}

const YEARS_BACK = 4;

function monthLabel(month: number) {
  // Any year works -- only the month name is read off it.
  return format(new Date(2000, month - 1, 1), "MMMM");
}

export function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const { currentYear, currentMonth, years } = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return {
      currentYear: y,
      currentMonth: now.getMonth() + 1,
      years: Array.from({ length: YEARS_BACK + 1 }, (_, i) => y - i),
    };
  }, []);

  // One half can be chosen before the other, but `value` only exists once both
  // are. While a selection is half-finished this holds it and takes precedence
  // over `value` -- deferring to `value` instead would make clearing a stranded
  // month invisible, since the parent still holds the old complete pair.
  const [pending, setPending] = React.useState<{ month?: number; year?: number } | null>(null);

  const month = pending ? pending.month : value?.month;
  const year = pending ? pending.year : value?.year;

  const isFuture = (m: number, y?: number) => y === currentYear && m > currentMonth;

  // TEMP DEBUG -- remove once the Run Report issue is diagnosed.
  console.log("[picker] render", { value, pending, month, year, hasOnChange: typeof onChange });

  function commit(next: { month?: number; year?: number }) {
    console.log("[picker] commit", next, "-> complete?", next.month != null && next.year != null);
    if (next.month != null && next.year != null) {
      setPending(null);
      console.log("[picker] calling onChange with", { month: next.month, year: next.year });
      onChange?.({ month: next.month, year: next.year });
      return;
    }
    setPending(next);
  }

  function handleMonth(v: string | null) {
    console.log("[picker] handleMonth raw value:", JSON.stringify(v), "typeof", typeof v);
    if (!v) return;
    commit({ month: Number(v), year });
  }

  function handleYear(v: string | null) {
    console.log("[picker] handleYear raw value:", JSON.stringify(v), "typeof", typeof v);
    if (!v) return;
    const nextYear = Number(v);
    // Moving to the current year can strand a month that is now in the future
    // (December picked first, then this year). Drop it rather than quietly
    // choosing a different month on the user's behalf.
    const keptMonth = month != null && isFuture(month, nextYear) ? undefined : month;
    commit({ month: keptMonth, year: nextYear });
  }

  return (
    <div className="flex items-center gap-2">
      {/* `null`, never `undefined`: Base UI latches controlled-ness on the first
          render via `controlled !== undefined`, so an undefined value here would
          start the select uncontrolled and warn as soon as one is picked. */}
      <Select value={month != null ? String(month) : null} onValueChange={handleMonth}>
        <SelectTrigger className="w-40">
          {month != null ? <span>{monthLabel(month)}</span> : <span className="text-muted-foreground">Month</span>}
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <SelectItem key={m} value={String(m)} disabled={isFuture(m, year)}>
              {monthLabel(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year != null ? String(year) : null} onValueChange={handleYear}>
        <SelectTrigger className="w-28">
          {year != null ? <span>{year}</span> : <span className="text-muted-foreground">Year</span>}
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
