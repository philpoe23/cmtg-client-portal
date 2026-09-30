import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  variant?: "default" | "warning" | "muted";
}

const variantStyles: Record<string, string> = {
  default: "text-foreground",
  warning: "text-cmtg-status-pending-fg",
  muted: "text-muted-foreground",
};

export default function StatsCard({ title, value, variant = "default" }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-5 px-5.5">
        <CardTitle className="font-sans text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5.5 pb-5">
        <p className={cn("font-heading text-cmtg-display font-semibold tabular-nums", variantStyles[variant])}>{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
