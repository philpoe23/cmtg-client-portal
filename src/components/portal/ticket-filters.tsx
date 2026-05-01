"use client";

import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { X } from "lucide-react";
import type { TicketFilters } from "@/types";
import { useTrack } from "@/hooks/use-track";

interface TicketFiltersBarProps {
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
}

const STATUSES = ["Open", "In Progress", "Waiting for Customer", "Pending", "Closed"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];

export default function TicketFiltersBar({ filters, onChange }: TicketFiltersBarProps) {
  const { track } = useTrack();

  function handleChange(key: keyof TicketFilters, value: string | undefined) {
    const updated = { ...filters, [key]: value, page: 1 };
    onChange(updated);
    if (key === "status") {
      track({ event_type: "filter", event_name: "filter_by_status", metadata: { status: value } });
    } else if (key === "priority") {
      track({
        event_type: "filter",
        event_name: "filter_by_priority",
        metadata: { priority: value },
      });
    }
  }

  function handleSearch(value: string) {
    onChange({ ...filters, search: value || undefined, page: 1 });
  }

  const dateRange: DateRange | undefined =
    filters.date_from || filters.date_to
      ? {
          from: filters.date_from ? new Date(filters.date_from) : undefined,
          to: filters.date_to ? new Date(filters.date_to) : undefined,
        }
      : undefined;

  function handleDateRange(range: DateRange | undefined) {
    onChange({
      ...filters,
      date_from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      date_to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
      page: 1,
    });
  }

  function clearFilters() {
    onChange({ page: 1, page_size: filters.page_size });
  }

  const hasFilters = !!(filters.status || filters.priority || filters.date_from || filters.date_to || filters.search);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input placeholder="Search tickets…" className="h-8 w-52 text-sm" value={filters.search ?? ""} onChange={(e) => handleSearch(e.target.value)} />

      <Select value={filters.status ?? "all"} onValueChange={(v) => handleChange("status", v === "all" ? undefined : (v ?? undefined))}>
        <SelectTrigger className="h-8 w-40 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority ?? "all"} onValueChange={(v) => handleChange("priority", v === "all" ? undefined : (v ?? undefined))}>
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DatePickerWithRange value={dateRange} onSelect={handleDateRange} className="h-8 text-sm" />

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={clearFilters}>
          <X size={12} className="mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
