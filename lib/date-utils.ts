import type { MaintenanceLabel } from "./types";

/**
 * 计算距今多少天
 */
export function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 根据 pushed_at / updated_at 判断维护状态标签
 */
export function getMaintenanceLabel(
  pushedAt: string | null,
  updatedAt: string | null,
  archived: boolean
): MaintenanceLabel {
  if (archived) return "已归档";

  const dateStr = pushedAt || updatedAt;
  if (!dateStr) return "疑似停更";

  const days = daysSince(dateStr);

  if (days <= 30) return "非常活跃";
  if (days <= 90) return "活跃";
  if (days <= 180) return "正常维护";
  if (days <= 365) return "低频维护";
  if (days <= 730) return "维护风险";

  return "疑似停更";
}

/**
 * 活跃度评分 (0-100)
 */
export function calculateActivityScore(
  pushedAt: string | null,
  updatedAt: string | null,
  archived: boolean
): number {
  if (archived) return 0;

  const dateStr = pushedAt || updatedAt;
  if (!dateStr) return 5;

  const days = daysSince(dateStr);

  if (days <= 30) return 100;
  if (days <= 90) return 80;
  if (days <= 180) return 65;
  if (days <= 365) return 45;
  if (days <= 730) return 20;

  return 5;
}

/**
 * 项目成熟度评分 (0-100)，基于 star、fork、创建时间
 */
export function calculateMaturityScore(
  stars: number,
  forks: number,
  createdAt: string
): number {
  let score = 0;

  // star 指标 (最多 50 分)
  if (stars >= 10000) score += 50;
  else if (stars >= 5000) score += 45;
  else if (stars >= 1000) score += 40;
  else if (stars >= 500) score += 35;
  else if (stars >= 100) score += 25;
  else if (stars >= 10) score += 15;
  else score += 5;

  // fork 指标 (最多 25 分)
  if (forks >= 1000) score += 25;
  else if (forks >= 500) score += 20;
  else if (forks >= 100) score += 15;
  else if (forks >= 10) score += 10;
  else score += 5;

  // 维护年限 (最多 25 分)
  const created = new Date(createdAt);
  const now = new Date();
  const years = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years >= 5) score += 25;
  else if (years >= 3) score += 20;
  else if (years >= 1) score += 15;
  else if (years >= 0.5) score += 10;
  else score += 5;

  return Math.min(100, score);
}

/**
 * License 评分 (0-100)
 */
export function calculateLicenseScore(
  license: { spdx_id: string } | null | undefined
): number {
  if (!license) return 20; // 未声明

  const spdx = license.spdx_id.toLowerCase();

  if (spdx === "mit" || spdx === "apache-2.0" || spdx === "bsd-2-clause" || spdx === "bsd-3-clause") {
    return 100;
  }
  if (spdx.includes("gpl") || spdx.includes("agpl")) {
    return 50;
  }
  // 其他已知 license
  if (spdx !== "noassertion" && spdx !== "other") {
    return 70;
  }

  return 30;
}

/**
 * 格式化距今时间的中文描述
 */
export function formatTimeAgo(dateStr: string): string {
  const days = daysSince(dateStr);
  if (days < 1) return "今天";
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}
