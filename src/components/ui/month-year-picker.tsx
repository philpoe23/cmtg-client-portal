"use client";

import * as React from "react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface MonthYearValue {
  month: number; // 1–12
  year: number;
}

interface MonthYearPickerProps {
  value?: MonthYearValue;
  onChange?: (value: MonthYearValue) => void;
}

// "YYYY-MM" string used as option values
function toOptionValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getOptions(): { value: string; label: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1–12
  const options: { value: string; label: string }[] = [];
  for (let y = currentYear; y >= currentYear - 4; y--) {
    const maxMonth = y === currentYear ? currentMonth : 12;
    for (let m = maxMonth; m >= 1; m--) {
      options.push({
        value: toOptionValue(y, m),
        label: format(new Date(y, m - 1, 1), "MMMM yyyy"),
      });
    }
  }
  return options;
}

export function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const options = React.useMemo(getOptions, []);

  function handleChange(v: string | null) {
    if (!v) return;
    const [year, month] = v.split("-").map(Number);
    onChange?.({ month, year });
  }

  const selected = value != null ? toOptionValue(value.year, value.month) : undefined;

  const displayLabel = value != null ? format(new Date(value.year, value.month - 1, 1), "MMMM yyyy") : null;

  return (
    <Select value={selected} onValueChange={handleChange}>
      <SelectTrigger className="w-48">{displayLabel ? <span>{displayLabel}</span> : <span className="text-muted-foreground">Select month</span>}</SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
