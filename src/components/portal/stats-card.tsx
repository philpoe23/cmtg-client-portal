import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  variant?: "default" | "warning" | "muted";
}

const variantStyles: Record<string, string> = {
  default: "text-foreground",
  warning: "text-amber-400",
  muted: "text-muted-foreground",
};

export default function StatsCard({ title, value, variant = "default" }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-5">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <p className={cn("text-3xl font-bold tabular-nums", variantStyles[variant])}>{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
