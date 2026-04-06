"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DateFilterProps {
  value: "today" | "week" | "month";
  onChange: (value: "today" | "week" | "month") => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as "today" | "week" | "month")}>
      <TabsList className="w-full">
        <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
        <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
        <TabsTrigger value="month" className="flex-1">This Month</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
