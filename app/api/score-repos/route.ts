/**
 * POST /api/score-repos
 *
 * 对搜索到的 GitHub 项目进行综合评分：
 * - 硬指标（活跃度/成熟度/License）直接计算
 * - AI 语义相似度 + 可改造性由 DeepSeek 判断
 * - README 总结优先走 NVIDIA 分流
 */

import { NextRequest, NextResponse } from "next/server";
import { scoreRepos } from "@/lib/scoring";
import { batchFetchReadmes } from "@/lib/github";
import { isDeepSeekConfigured } from "@/lib/ai/deepseek";
import { filterSafeRepos } from "@/lib/safety";
import type { GitHubRepo } from "@/lib/types";
import crypto from "crypto";
import { saveRepoResults } from "@/lib/cache";

interface ScoreInput {
  userInput: string;
  repos: GitHubRepo[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ScoreInput = await request.json();
    const { userInput, repos } = body;

    if (!userInput || !repos || !Array.isArray(repos)) {
      return NextResponse.json(
        { error: "缺少用户输入或项目列表" },
        { status: 400 }
      );
    }

    if (!isDeepSeekConfigured()) {
      return NextResponse.json(
        { error: "DeepSeek API 未配置，请设置 DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }

    // 安全过滤（双保险：搜索阶段已过滤，此处再次确认）
    const { safe: safeRepos, blocked } = filterSafeRepos(repos);
    if (blocked.length > 0) {
      console.log(`[score-repos] 安全过滤: 二次拦截 ${blocked.length} 个敏感仓库`);
    }

    // 批量抓取 README（Top 20）
    const readmeMap = await batchFetchReadmes(safeRepos, 20);

    // 执行评分（内部包含相关性预筛选）
    const scoredRepos = await scoreRepos({
      userInput,
      repos: safeRepos,
      readmeMap,
    });

    // 保存结果到数据库
    const sessionId = crypto.randomUUID();
    try {
      await saveRepoResults(
        sessionId,
        scoredRepos.map((sr) => ({
          id: crypto.randomUUID(),
          full_name: sr.repo.full_name,
          html_url: sr.repo.html_url,
          description: sr.repo.description,
          language: sr.repo.language,
          stars: sr.repo.stargazers_count,
          forks: sr.repo.forks_count,
          open_issues: sr.repo.open_issues_count,
          license: sr.repo.license?.spdx_id || null,
          created_at: sr.repo.created_at,
          updated_at: sr.repo.updated_at,
          pushed_at: sr.repo.pushed_at,
          archived: sr.repo.archived ? 1 : 0,
          homepage: sr.repo.homepage,
          topics_json: JSON.stringify(sr.repo.topics || []),
          readme_summary: sr.readmeSummary || null,
          similarity_score: sr.similarityScore,
          activity_score: sr.activityScore,
          total_score: sr.totalScore,
          recommendation: sr.recommendation,
        }))
      );
    } catch (err) {
      console.warn("保存评分结果失败:", err);
    }

    return NextResponse.json({ scoredRepos });
  } catch (err) {
    console.error("/api/score-repos 错误:", err);
    const message = err instanceof Error ? err.message : "项目评分失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
