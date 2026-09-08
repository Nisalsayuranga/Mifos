import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: "green" | "amber" | "red" | "blue" | "purple" | "sand";
  className?: string;
}

const colorMap = {
  green:  { bg: "bg-emerald-50",  icon: "bg-emerald-100 text-emerald-700",  value: "text-emerald-700" },
  amber:  { bg: "bg-amber-50",    icon: "bg-amber-100 text-amber-700",      value: "text-amber-700" },
  red:    { bg: "bg-red-50",      icon: "bg-red-100 text-red-700",          value: "text-red-700" },
  blue:   { bg: "bg-blue-50",     icon: "bg-blue-100 text-blue-700",        value: "text-blue-700" },
  purple: { bg: "bg-purple-50",   icon: "bg-purple-100 text-purple-700",    value: "text-purple-700" },
  sand:   { bg: "bg-[#FAF0E4]",   icon: "bg-secondary/20 text-secondary",   value: "text-secondary" },
};

export function DashboardCard({ title, value, subtitle, icon: Icon, trend, color = "green", className }: DashboardCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold mt-1", c.value)}>{value}</p>
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", c.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", trend.positive ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50")}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </span>
          )}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
