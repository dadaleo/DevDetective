import type { MaintenanceLabel } from "@/lib/types";

interface Props {
  label: MaintenanceLabel;
}

const STYLE_MAP: Record<MaintenanceLabel, { bg: string; text: string; dot: string }> = {
  "非常活跃": { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  "活跃": { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
  "正常维护": { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  "低频维护": { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  "维护风险": { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  "疑似停更": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  "已归档": { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400" },
};

export default function MaintenanceBadge({ label }: Props) {
  const style = STYLE_MAP[label] || STYLE_MAP["疑似停更"];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
