import type { ScoredRepo } from "@/lib/types";
import MaintenanceBadge from "./MaintenanceBadge";
import ScoreBadge from "./ScoreBadge";
import { formatTimeAgo } from "@/lib/date-utils";

interface Props {
  repo: ScoredRepo;
  rank: number;
}

const RECOMMENDATION_STYLES: Record<string, string> = {
  "建议 fork 改造": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "适合参考架构": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "适合参考 UI": "bg-violet-500/10 text-violet-400 border-violet-500/30",
  "适合借鉴局部功能": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "仅供调研": "bg-gray-500/10 text-gray-400 border-gray-500/30",
  "不建议使用": "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function RepoCard({ repo, rank }: Props) {
  const { repo: r } = repo;
  const recStyle = RECOMMENDATION_STYLES[repo.recommendation] || RECOMMENDATION_STYLES["仅供调研"];

  return (
    <div className="glass-card p-5 hover:border-primary-500/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[#5c6378] bg-[#1a1d27] px-1.5 py-0.5 rounded">
              #{rank}
            </span>
            <a
              href={r.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-[#e4e7ee] hover:text-primary-400 truncate transition-colors"
            >
              {r.full_name}
            </a>
          </div>
          <p className="text-sm text-[#8b92a5] line-clamp-2">{r.description || "无描述"}</p>
        </div>
        <ScoreBadge score={repo.totalScore} />
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-[#5c6378]">
        {r.language && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-400" />
            {r.language}
          </span>
        )}
        <span>⭐ {r.stargazers_count.toLocaleString()}</span>
        <span>⑂ {r.forks_count.toLocaleString()}</span>
        <span>📋 {r.license?.spdx_id || "无 License"}</span>
      </div>

      {r.topics?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {r.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-[#2d3343] bg-[#11141c] px-2 py-1 text-[11px] text-[#8b92a5]"
            >
              #{topic}
            </span>
          ))}
        </div>
      )}

      {/* Dates & Maintenance */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <MaintenanceBadge label={repo.maintenanceLabel} />
        <span className="text-xs text-[#5c6378]">
          最近提交 {formatTimeAgo(r.pushed_at)} · 创建于{" "}
          {new Date(r.created_at).toLocaleDateString("zh-CN")}
        </span>
      </div>

      {/* AI Reason */}
      {repo.aiReason && (
        <p className="text-xs text-[#8b92a5] bg-[#1a1d27] rounded-lg p-2.5 mb-3 leading-relaxed">
          💡 {repo.aiReason}
        </p>
      )}

      {/* Recommendation badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${recStyle}`}>
          {repo.recommendation}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(r.html_url)}
          className="text-xs text-[#5c6378] hover:text-[#e4e7ee] transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          复制链接
        </button>
      </div>
    </div>
  );
}
