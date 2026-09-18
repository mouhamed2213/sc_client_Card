import type { LucideIcon } from "lucide-react";

export default function KpiTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="kpi-tile">
      <Icon size={17} className="text-[#7d8798]" />
      <p className="kpi-tile-value">{value}</p>
      <p className="kpi-tile-label">{label}</p>
    </div>
  );
}
