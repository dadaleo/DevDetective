/**
 * 内容安全过滤器
 *
 * 过滤 GitHub 仓库中的政治敏感、不当内容，
 * 确保搜索结果适合国内网络环境展示。
 */

import type { GitHubRepo, ScoredRepo } from "./types";

/**
 * 敏感关键词屏蔽列表
 *
 * 匹配规则：不区分大小写，匹配 repo name / description / topics
 * 增加新词时请确保不会误杀正常技术项目
 */
const BLOCKED_KEYWORDS: string[] = [
  // 政治宣传 / 敏感政治
  "propaganda",
  "political",
  "politic",
  "activist",
  "falun",
  "法轮",
  "tiananmen",
  "天安门",
  "tibet",
  "西藏",
  "xinjiang",
  "新疆",
  "uighur",
  "维吾尔",
  "taiwan independence",
  "台独",
  "hong kong protest",
  "hk protest",
  "anti-china",
  "反华",
  "free tibet",
  "free hong kong",
  "hong kong freedom",
  "china censorship",
  "china firewall",
  "great firewall",
  "gfw",
  "democracy activist",
  "human rights china",
  "ccp",
  "communist party",
  "communist china",
  "chinese communist",
  // 色情 / NSFW
  "porn",
  "xxx",
  "adult content",
  "nsfw",
  "onlyfans",
  // 暴力 / 极端
  "terroris",
  "extremis",
  "massacre",
  "genocide",
  "大屠杀",
  // 赌博 / 非法
  "casino",
  "gambling",
  "betting site",
  "赌场",
  "赌博",
];

/**
 * 检查文本是否包含任一敏感关键词
 */
function containsBlocked(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * 过滤 GitHubRepo 列表，移除含敏感内容的仓库
 *
 * @returns { safe: 安全仓库, blocked: 被过滤的仓库名列表 }
 */
export function filterSafeRepos(
  repos: GitHubRepo[]
): { safe: GitHubRepo[]; blocked: string[] } {
  const safe: GitHubRepo[] = [];
  const blocked: string[] = [];

  for (const repo of repos) {
    const texts = [
      repo.name,
      repo.full_name,
      repo.description || "",
      ...(repo.topics || []),
    ];

    if (texts.some(containsBlocked)) {
      blocked.push(repo.full_name);
      console.warn(`[safety] 已过滤敏感仓库: ${repo.full_name}`);
    } else {
      safe.push(repo);
    }
  }

  return { safe, blocked };
}

/**
 * 过滤 ScoredRepo 列表
 */
export function filterSafeScoredRepos(
  repos: ScoredRepo[]
): { safe: ScoredRepo[]; blocked: string[] } {
  const safe: ScoredRepo[] = [];
  const blocked: string[] = [];

  for (const sr of repos) {
    const repo = sr.repo;
    const texts = [
      repo.name,
      repo.full_name,
      repo.description || "",
      ...(repo.topics || []),
    ];

    if (texts.some(containsBlocked)) {
      blocked.push(repo.full_name);
      console.warn(`[safety] 已过滤敏感仓库: ${repo.full_name}`);
    } else {
      safe.push(sr);
    }
  }

  return { safe, blocked };
}
