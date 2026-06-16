/**
 * GitHub REST API 封装
 *
 * 功能：多关键词搜索、合并去重、README 抓取、限流处理
 *
 * 文档: https://docs.github.com/en/rest/reference/search
 */

import type { GitHubRepo } from "./types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const BASE_URL = "https://api.github.com";

interface SearchResult {
  total_count: number;
  items: GitHubRepo[];
}

/**
 * 通用请求封装，带 GitHub Token 和限流处理
 */
async function githubFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevDetective/0.1.0",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, { headers });

  if (response.status === 403) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const resetTime = response.headers.get("x-ratelimit-reset");
    if (remaining === "0") {
      const resetDate = resetTime
        ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString("zh-CN")
        : "未知";
      throw new Error(`GitHub API 请求频率限制已达上限，请在 ${resetDate} 后重试`);
    }
    throw new Error("GitHub API 访问被拒绝，请检查 Token 是否有效");
  }

  if (response.status === 422) {
    throw new Error("GitHub 搜索查询格式错误，请尝试调整搜索词");
  }

  if (!response.ok) {
    throw new Error(`GitHub API 错误 (${response.status}): ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * 根据单个搜索 query 搜索仓库
 */
export async function searchRepos(
  query: string,
  limit: number = 10
): Promise<GitHubRepo[]> {
  const path = `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;
  const result = await githubFetch<SearchResult>(path);
  return result.items || [];
}

/**
 * 多关键词搜索，合并去重
 */
export async function multiSearchRepos(
  queries: string[],
  limit: number = 20
): Promise<GitHubRepo[]> {
  const allResults: GitHubRepo[] = [];
  const seen = new Set<string>();

  // 串行搜索以避免触发 GitHub 次级限流
  for (const query of queries) {
    try {
      const repos = await searchRepos(query, Math.ceil(limit / queries.length) + 5);
      for (const repo of repos) {
        if (!seen.has(repo.full_name)) {
          seen.add(repo.full_name);
          allResults.push(repo);
        }
      }
    } catch (err) {
      console.warn(`搜索 "${query}" 失败:`, err);
      // 单个 query 失败不中断整体流程
    }
  }

  // 按 star 降序
  allResults.sort((a, b) => b.stargazers_count - a.stargazers_count);

  return allResults.slice(0, limit);
}

/**
 * 获取仓库的 README 内容
 * 最大读取 20,000 字符
 */
export async function fetchReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const path = `/repos/${owner}/${repo}/readme`;
    const data = await githubFetch<{
      content: string;
      encoding: string;
      download_url: string;
    }>(path);

    // GitHub README API 返回 base64 编码内容
    if (data.content && data.encoding === "base64") {
      const text = Buffer.from(data.content, "base64").toString("utf-8");
      return text.slice(0, 20000);
    }

    return null;
  } catch {
    // README 不存在或无法读取
    return null;
  }
}

/**
 * 批量获取 README（仅对 Top N 项目）
 */
export async function batchFetchReadmes(
  repos: GitHubRepo[],
  topN: number = 20
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const targets = repos.slice(0, topN);

  // 串行获取，避免触发限流
  for (const repo of targets) {
    const [owner, name] = repo.full_name.split("/");
    const readme = await fetchReadme(owner, name);
    if (readme) {
      results.set(repo.full_name, readme);
    }
  }

  return results;
}

/**
 * 获取单仓库详细信息（用于缓存）
 */
export async function fetchRepoDetail(
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const path = `/repos/${owner}/${repo}`;
  return githubFetch<GitHubRepo>(path);
}

/**
 * 检查 GitHub Token 是否已配置
 */
export function isGitHubConfigured(): boolean {
  return !!GITHUB_TOKEN;
}
