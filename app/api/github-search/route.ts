/**
 * POST /api/github-search
 *
 * 使用 GitHub REST API 执行多关键词搜索，合并去重后返回仓库列表
 */

import { NextRequest, NextResponse } from "next/server";
import { multiSearchRepos, isGitHubConfigured } from "@/lib/github";
import { filterSafeRepos } from "@/lib/safety";
import type { GitHubRepo } from "@/lib/types";

interface SearchInput {
  searchQueries: string[];
  limit?: number;
  filters?: {
    techStack?: string;
    projectType?: string;
    updatePreference?: string;
    licensePreference?: string;
  };
}

function applyFilters(repos: GitHubRepo[], filters?: SearchInput["filters"]): GitHubRepo[] {
  if (!filters) return repos;

  return repos.filter((repo) => {
    const text = `${repo.name} ${repo.full_name} ${repo.description || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();

    if (filters.techStack && !text.includes(filters.techStack.toLowerCase()) && repo.language?.toLowerCase() !== filters.techStack.toLowerCase()) {
      return false;
    }

    if (filters.licensePreference) {
      const spdx = repo.license?.spdx_id?.toLowerCase() || "";
      if (filters.licensePreference.includes("MIT") && !["mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause"].includes(spdx)) {
        return false;
      }
      if (filters.licensePreference.includes("商用") && (!spdx || spdx.includes("gpl") || spdx.includes("agpl"))) {
        return false;
      }
    }

    return true;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchInput = await request.json();
    const { searchQueries, limit, filters } = body;

    if (!searchQueries || !Array.isArray(searchQueries) || searchQueries.length === 0) {
      return NextResponse.json(
        { error: "缺少搜索关键词" },
        { status: 400 }
      );
    }

    if (!isGitHubConfigured()) {
      return NextResponse.json(
        { error: "GitHub Token 未配置，请设置 GITHUB_TOKEN" },
        { status: 500 }
      );
    }

    const rawRepos = await multiSearchRepos(searchQueries, limit || 20);
    const filteredRepos = applyFilters(rawRepos, filters);

    // 安全过滤：移除含敏感内容的仓库
    const { safe: repos, blocked } = filterSafeRepos(filteredRepos);
    if (blocked.length > 0) {
      console.log(`[github-search] 安全过滤: 移除 ${blocked.length} 个敏感仓库`);
    }

    return NextResponse.json({ repos });
  } catch (err) {
    console.error("/api/github-search 错误:", err);
    const message = err instanceof Error ? err.message : "GitHub 搜索失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
