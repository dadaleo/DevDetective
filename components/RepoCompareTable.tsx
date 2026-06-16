import type { ScoredRepo } from "@/lib/types";
import MaintenanceBadge from "./MaintenanceBadge";

interface Props {
  repos: ScoredRepo[];
}

export default function RepoCompareTable({ repos }: Props) {
  if (repos.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2d3343]">
            <th className="text-left py-3 px-4 text-xs text-[#5c6378] font-medium uppercase">
              排名
            </th>
            <th className="text-left py-3 px-4 text-xs text-[#5c6378] font-medium uppercase">
              项目
            </th>
            <th className="text-center py-3 px-4 text-xs text-[#5c6378] font-medium uppercase">
              评分
            </th>
            <th className="text-center py-3 px-4 text-xs text-[#5c6378] font-medium uppercase">
              维护状态
            </th>
            <th className="text-left py-3 px-4 text-xs text-[#5c6378] font-medium uppercase">
              建议
            </th>
          </tr>
        </thead>
        <tbody>
          {repos.slice(0, 5).map((sr, i) => (
            <tr key={sr.repo.full_name} className="border-b border-[#2d3343]/50 hover:bg-[#1a1d27]">
              <td className="py-3 px-4 font-mono text-[#5c6378]">#{i + 1}</td>
              <td className="py-3 px-4">
                <a
                  href={sr.repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e4e7ee] hover:text-primary-400 font-medium"
                >
                  {sr.repo.full_name}
                </a>
                <div className="text-xs text-[#5c6378] mt-0.5">
                  ⭐ {sr.repo.stargazers_count.toLocaleString()} · {sr.repo.language || "N/A"}
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`font-bold ${
                    sr.totalScore >= 80
                      ? "text-emerald-400"
                      : sr.totalScore >= 60
                        ? "text-blue-400"
                        : "text-yellow-400"
                  }`}
                >
                  {sr.totalScore}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <MaintenanceBadge label={sr.maintenanceLabel} />
              </td>
              <td className="py-3 px-4 text-xs text-[#8b92a5]">{sr.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
