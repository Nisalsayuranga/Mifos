import { cn } from "@/lib/utils";

type Status = "approved" | "pending" | "rejected" | "verified" | "featured" | "draft" | "requested" | "assigned" | "scheduled" | "completed" | "under_review" | "referred" | "submitted" | "sale" | "rent" | "published";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  approved:     { label: "Approved",      className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  published:    { label: "Published",     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  pending:      { label: "Pending Review",className: "bg-amber-100 text-amber-800 border-amber-200" },
  rejected:     { label: "Rejected",      className: "bg-red-100 text-red-800 border-red-200" },
  verified:     { label: "Verified",      className: "bg-primary/10 text-primary border-primary/20" },
  featured:     { label: "Featured",      className: "bg-secondary/20 text-secondary border-secondary/30" },
  draft:        { label: "Draft",         className: "bg-slate-100 text-slate-600 border-slate-200" },
  requested:    { label: "Requested",     className: "bg-blue-100 text-blue-800 border-blue-200" },
  assigned:     { label: "Assigned",      className: "bg-purple-100 text-purple-800 border-purple-200" },
  scheduled:    { label: "Scheduled",     className: "bg-teal-100 text-teal-800 border-teal-200" },
  completed:    { label: "Completed",     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  under_review: { label: "Under Review",  className: "bg-amber-100 text-amber-800 border-amber-200" },
  referred:     { label: "Referred",      className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  submitted:    { label: "Submitted",     className: "bg-blue-100 text-blue-800 border-blue-200" },
  sale:         { label: "For Sale",      className: "bg-primary/10 text-primary border-primary/20" },
  rent:         { label: "For Rent",      className: "bg-secondary/20 text-secondary border-secondary/30" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", config.className, className)}>
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {config.label}
    </span>
  );
}
