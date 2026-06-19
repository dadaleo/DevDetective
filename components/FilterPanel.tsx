"use client";

import { useState } from "react";
import type { SearchFilters } from "@/lib/types";

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  disabled?: boolean;
}

const TECH_STACKS = ["不限", "React", "Next.js", "Vue", "Python", "FastAPI", "Electron", "Tauri", "Node.js", "微信小程序", "CLI"];
const PROJECT_TYPES = ["不限", "Web 应用", "桌面应用", "浏览器插件", "自动化脚本", "命令行工具", "小程序", "API 服务"];
const UPDATE_PREFS = [
  { value: "", label: "不限" },
  { value: "最近 3 个月有更新", label: "最近 3 个月有更新" },
  { value: "最近 6 个月有更新", label: "最近 6 个月有更新" },
  { value: "最近 1 年有更新", label: "最近 1 年有更新" },
  { value: "最近 2 年有更新", label: "最近 2 年有更新" },
];
const LICENSE_PREFS = ["不限", "MIT / Apache / BSD 等友好协议", "可商用协议"];

function buildSummary(filters: SearchFilters) {
  return [
    filters.techStack && filters.techStack !== "不限" ? filters.techStack : "不限技术栈",
    filters.projectType && filters.projectType !== "不限" ? filters.projectType : "不限应用形态",
    filters.updatePreference || "优先近期维护",
    filters.licensePreference && filters.licensePreference !== "不限" ? filters.licensePreference : "License 不限",
  ];
}

export default function FilterPanel({ filters, onChange, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);

  const update = (key: keyof SearchFilters, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const tech = filters.techStack || "不限";
  const type = filters.projectType || "不限";
  const upd = filters.updatePreference || "";
  const lic = filters.licensePreference || "不限";
  const summaryItems = buildSummary(filters);

  return (
    <div className="rounded-[20px] border border-[#2b3648]/70 bg-[#111723]/72 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d6d86]">侦查偏好</p>
          <div className="flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#334055] bg-[#161e2b] px-3 py-1 text-xs text-[#98a7be]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          disabled={disabled}
          className="inline-flex items-center gap-2 self-start rounded-full border border-[#38506f] bg-[#162131] px-3 py-1.5 text-xs font-medium text-[#a8bee0] transition-colors hover:border-[#4d6f97] hover:text-[#d8e6ff] disabled:opacity-50"
        >
          调整筛选
          <svg
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-[#283243] pt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[#5d6d86]">技术栈</label>
              <select
                className="w-full rounded-xl border border-[#334055] bg-[#0d131d] px-3 py-2 text-sm text-[#edf2ff] outline-none transition-colors focus:border-[#55c1b3]"
                value={tech}
                onChange={(e) => update("techStack", e.target.value === "不限" ? "" : e.target.value)}
                disabled={disabled}
              >
                {TECH_STACKS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[#5d6d86]">应用形态</label>
              <select
                className="w-full rounded-xl border border-[#334055] bg-[#0d131d] px-3 py-2 text-sm text-[#edf2ff] outline-none transition-colors focus:border-[#55c1b3]"
                value={type}
                onChange={(e) => update("projectType", e.target.value === "不限" ? "" : e.target.value)}
                disabled={disabled}
              >
                {PROJECT_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[#5d6d86]">维护偏好</label>
              <select
                className="w-full rounded-xl border border-[#334055] bg-[#0d131d] px-3 py-2 text-sm text-[#edf2ff] outline-none transition-colors focus:border-[#55c1b3]"
                value={upd}
                onChange={(e) => update("updatePreference", e.target.value)}
                disabled={disabled}
              >
                {UPDATE_PREFS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[#5d6d86]">License</label>
              <select
                className="w-full rounded-xl border border-[#334055] bg-[#0d131d] px-3 py-2 text-sm text-[#edf2ff] outline-none transition-colors focus:border-[#55c1b3]"
                value={lic}
                onChange={(e) => update("licensePreference", e.target.value === "不限" ? "" : e.target.value)}
                disabled={disabled}
              >
                {LICENSE_PREFS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-[#2d394c] bg-[#101722] px-3 py-2.5 text-sm text-[#97a4ba]">
              <span>优先近期维护仓库</span>
              <input
                type="checkbox"
                checked={!!filters.preferRecent}
                onChange={(e) => update("preferRecent", e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-[#4a92ff]"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[#2d394c] bg-[#101722] px-3 py-2.5 text-sm text-[#97a4ba]">
              <span>优先轻量易改项目</span>
              <input
                type="checkbox"
                checked={!!filters.preferLightweight}
                onChange={(e) => update("preferLightweight", e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-[#4a92ff]"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
