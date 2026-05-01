"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  value?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({ value, onSelect, className }: DatePickerWithRangeProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>();
  const date = value ?? internalDate;
  const handleSelect = onSelect ?? setInternalDate;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className={cn("justify-start px-2.5 font-normal", !date && "text-muted-foreground", className)} />}>
        <CalendarIcon />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={handleSelect} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}
