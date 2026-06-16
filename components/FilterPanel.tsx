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
  { value: "", label: "不限制" },
  { value: "最近 3 个月有更新", label: "近期活跃（3 个月）" },
  { value: "最近 6 个月有更新", label: "半年内活跃" },
  { value: "最近 1 年有更新", label: "一年内有维护" },
  { value: "最近 2 年有更新", label: "两年内有更新" },
];
const LICENSE_PREFS = ["不限", "MIT / Apache / BSD 等友好协议", "可商用协议"];

function summaryLine(f: SearchFilters): string {
  const parts: string[] = [];
  parts.push(f.techStack && f.techStack !== "不限" ? f.techStack : "不限技术栈");
  parts.push(f.projectType && f.projectType !== "不限" ? f.projectType : "不限应用形态");
  parts.push(f.updatePreference || "不限制更新时间");
  parts.push(f.licensePreference && f.licensePreference !== "不限" ? f.licensePreference : "License 不限");
  if (f.preferRecent) parts.push("优先近期活跃");
  if (f.preferLightweight) parts.push("优先轻量项目");
  return parts.join(" · ");
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

  return (
    <div className="border border-[#2d3343]/50 rounded-lg bg-[#1a1d27]/50 px-5 py-3.5">
      {/* Collapsed summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-medium text-[#8b92a5] shrink-0">侦查偏好</span>
          <span className="text-xs text-[#5c6378] truncate">{summaryLine(filters)}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          disabled={disabled}
          className="text-xs font-medium bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 border border-primary-500/20 hover:border-primary-500/40 px-3 py-1 rounded-md transition-all shrink-0 ml-3 flex items-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {expanded ? "收起筛选" : "调整筛选"}
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-[#2d3343]/40 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* 技术方向 */}
            <div>
            <label className="block text-[11px] text-[#5c6378] mb-1.5 uppercase tracking-wider">技术方向</label>
            <select
              className="w-full bg-[#0f1117] border border-[#2d3343]/60 rounded-md px-2.5 py-1.5 text-xs text-[#e4e7ee] focus:outline-none focus:border-primary-500/50"
              value={tech}
              onChange={(e) => update("techStack", e.target.value === "不限" ? "" : e.target.value)}
              disabled={disabled}
            >
              {TECH_STACKS.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
            </div>

          {/* 应用形态 */}
            <div>
            <label className="block text-[11px] text-[#5c6378] mb-1.5 uppercase tracking-wider">应用形态</label>
            <select
              className="w-full bg-[#0f1117] border border-[#2d3343]/60 rounded-md px-2.5 py-1.5 text-xs text-[#e4e7ee] focus:outline-none focus:border-primary-500/50"
              value={type}
              onChange={(e) => update("projectType", e.target.value === "不限" ? "" : e.target.value)}
              disabled={disabled}
            >
              {PROJECT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
            </div>

          {/* 维护活跃度 */}
            <div>
            <label className="block text-[11px] text-[#5c6378] mb-1.5 uppercase tracking-wider">维护活跃度</label>
            <select
              className="w-full bg-[#0f1117] border border-[#2d3343]/60 rounded-md px-2.5 py-1.5 text-xs text-[#e4e7ee] focus:outline-none focus:border-primary-500/50"
              value={upd}
              onChange={(e) => update("updatePreference", e.target.value)}
              disabled={disabled}
            >
              {UPDATE_PREFS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
            </div>

          {/* 授权风险 */}
            <div>
            <label className="block text-[11px] text-[#5c6378] mb-1.5 uppercase tracking-wider">授权风险</label>
            <select
              className="w-full bg-[#0f1117] border border-[#2d3343]/60 rounded-md px-2.5 py-1.5 text-xs text-[#e4e7ee] focus:outline-none focus:border-primary-500/50"
              value={lic}
              onChange={(e) => update("licensePreference", e.target.value === "不限" ? "" : e.target.value)}
              disabled={disabled}
            >
              {LICENSE_PREFS.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-md border border-[#2d3343]/60 bg-[#0f1117] px-3 py-2 text-xs text-[#8b92a5]">
              <span>优先近期活跃仓库</span>
              <input
                type="checkbox"
                checked={!!filters.preferRecent}
                onChange={(e) => update("preferRecent", e.target.checked)}
                disabled={disabled}
                className="h-3.5 w-3.5 accent-[#4f8cff]"
              />
            </label>
            <label className="flex items-center justify-between rounded-md border border-[#2d3343]/60 bg-[#0f1117] px-3 py-2 text-xs text-[#8b92a5]">
              <span>优先轻量易改项目</span>
              <input
                type="checkbox"
                checked={!!filters.preferLightweight}
                onChange={(e) => update("preferLightweight", e.target.checked)}
                disabled={disabled}
                className="h-3.5 w-3.5 accent-[#4f8cff]"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
