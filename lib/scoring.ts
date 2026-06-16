/**
 * 评分引擎
 *
 * 混合评分策略：
 * 1. 硬指标（活跃度、成熟度、License）→ 直接计算
 * 2. AI 语义判断（相似度、可改造性）→ DeepSeek API
 * 3. 文档完整度 → README 启发式 + AI
 *
 * 总分 100 = 相似度(35) + 活跃度(20) + 成熟度(15) + License(10) + 文档(10) + 可改造性(10)
 */

import type { GitHubRepo, ScoredRepo, RecommendationAction } from "./types";
import {
  calculateActivityScore,
  calculateMaturityScore,
  calculateLicenseScore,
  getMaintenanceLabel,
} from "./date-utils";
import { deepseekChatJSON } from "./ai/deepseek";
import {
  SCORE_SIMILARITY_SYSTEM,
  buildScoreSimilarityPrompt,
  ASSESS_MODIFIABILITY_SYSTEM,
  buildAssessModifiabilityPrompt,
} from "./ai/prompts";
import { isNvidiaConfigured, nvidiaBatchSummarize } from "./ai/nvidia";
import {
  getCachedRepo,
  cacheRepo,
  getCachedReadmeSummaries,
  updateReadmeSummary,
} from "./cache";

// ─── 文档完整度评分（启发式） ───

function calculateHeuristicDocsScore(readmeText: string | null | undefined): number {
  if (!readmeText) return 10; // 无 README，给最低分

  let score = 20; // 有 README 基础分
  const text = readmeText.toLowerCase();

  if (text.includes("install") || text.includes("安装") || text.includes("getting started")) score += 15;
  if (text.includes("usage") || text.includes("使用") || text.includes("example")) score += 15;
  if (text.includes("screenshot") || text.includes("demo") || text.includes("preview") || text.includes("截图")) score += 15;
  if (text.includes("config") || text.includes("配置") || text.includes("setting")) score += 10;
  if (text.includes("contribut") || text.includes("贡献")) score += 10;
  if (text.includes("license") || text.includes("许可")) score += 5;
  if (readmeText.length > 2000) score += 10; // README 足够长

  return Math.min(100, score);
}

// ─── AI 语义相似度评分 ───

interface SimilarityResult {
  similarityScore: number;
  reuseLevel: RecommendationAction;
  reason: string;
}

async function aiScoreSimilarity(
  userInput: string,
  repo: GitHubRepo,
  readmeSummary?: string
): Promise<SimilarityResult> {
  const projectInfo = [
    `项目名: ${repo.full_name}`,
    `描述: ${repo.description || "无"}`,
    `语言: ${repo.language || "未知"}`,
    `Topics: ${(repo.topics || []).join(", ")}`,
    `Star: ${repo.stargazers_count}`,
    `README 摘要: ${readmeSummary || "无"}`,
  ].join("\n");

  const prompt = buildScoreSimilarityPrompt(userInput, projectInfo);

  try {
    const result = await deepseekChatJSON<SimilarityResult>({
      systemPrompt: SCORE_SIMILARITY_SYSTEM,
      userPrompt: prompt,
      temperature: 0.2,
      maxTokens: 500,
    });

    return {
      similarityScore: Math.max(0, Math.min(100, result.similarityScore || 50)),
      reuseLevel: result.reuseLevel || "仅供调研",
      reason: result.reason || "AI 评分不可用",
    };
  } catch (err) {
    console.warn(`AI 相似度评分失败 (${repo.full_name}):`, err);
    return {
      similarityScore: 40,
      reuseLevel: "仅供调研",
      reason: "AI 评分暂时不可用，建议人工评估",
    };
  }
}

// ─── AI 可改造性评分 ───

interface ModifiabilityResult {
  modifiabilityScore: number;
  assessment: string;
}

async function aiAssessModifiability(
  repo: GitHubRepo,
  readmeSummary?: string
): Promise<ModifiabilityResult> {
  const projectInfo = [
    `项目: ${repo.full_name}`,
    `描述: ${repo.description || "无"}`,
    `语言: ${repo.language || "未知"}`,
    `License: ${repo.license?.spdx_id || "未声明"}`,
    `Topics: ${(repo.topics || []).join(", ")}`,
    `README 摘要: ${readmeSummary || "无"}`,
  ].join("\n");

  const prompt = buildAssessModifiabilityPrompt(projectInfo);

  try {
    return await deepseekChatJSON<ModifiabilityResult>({
      systemPrompt: ASSESS_MODIFIABILITY_SYSTEM,
      userPrompt: prompt,
      temperature: 0.2,
      maxTokens: 300,
    });
  } catch (err) {
    console.warn(`AI 可改造性评分失败 (${repo.full_name}):`, err);
    return {
      modifiabilityScore: 50,
      assessment: "AI 评估不可用",
    };
  }
}

// ─── README 总结 (NVIDIA 优先，DeepSeek 回退) ───

async function summarizeReadmes(
  repos: GitHubRepo[],
  readmeMap: Map<string, string>
): Promise<Map<string, string>> {
  const summaryMap = new Map<string, string>();
  const tasks: { id: string; text: string }[] = [];

  // 收集需要总结的 README
  for (const repo of repos) {
    const readme = readmeMap.get(repo.full_name);
    if (!readme || readme.length < 100) {
      summaryMap.set(repo.full_name, readme ? readme.slice(0, 200) : "无 README");
      continue;
    }
    tasks.push({ id: repo.full_name, text: readme });
  }

  if (tasks.length === 0) return summaryMap;

  // 尝试 NVIDIA 批量总结
  if (isNvidiaConfigured()) {
    const results = await nvidiaBatchSummarize(tasks);
    for (const { id, summary } of results) {
      summaryMap.set(id, summary);
      // 缓存摘要
      await updateReadmeSummary(id, summary);
    }
    return summaryMap;
  }

  // 回退：DeepSeek 逐条总结（N 条并行）
  const results = await Promise.all(
    tasks.map(async ({ id, text }) => {
      try {
        const { deepseekChat: chat } = await import("./ai/deepseek");
        const summary = await chat({
          systemPrompt:
            "你是一个开源项目分析助手。请用 2-3 句中文简洁总结以下 README 内容，重点说明项目功能、技术栈和适用场景。",
          userPrompt: text.slice(0, 6000),
          maxTokens: 300,
        });
        await updateReadmeSummary(id, summary);
        return { id, summary };
      } catch {
        return { id, summary: text.slice(0, 200) };
      }
    })
  );

  for (const { id, summary } of results) {
    summaryMap.set(id, summary);
  }

  return summaryMap;
}

// ─── 相关性批量预筛选 ───

const RELEVANCE_FILTER_SYSTEM = `你是一个搜索相关性判断助手。

请判断以下 GitHub 项目是否与用户需求相关。

规则：
1. 项目功能与用户需求有直接关联 → relevant
2. 项目使用了相关技术但功能完全不同 → irrelevant
3. 项目名称相似但用途不同 → irrelevant
4. 项目为通用工具/框架/教学项目但与需求无关 → irrelevant
5. 只有明确相关的项目才标记为 relevant

请输出严格的 JSON 格式。`;

/**
 * 批量判断仓库相关性（一次 AI 调用）
 *
 * @returns 相关仓库的 full_name 集合
 */
async function filterRelevantRepos(
  userInput: string,
  repos: GitHubRepo[]
): Promise<Set<string>> {
  if (repos.length === 0) return new Set();

  const repoList = repos
    .map(
      (r, i) =>
        `${i + 1}. ${r.full_name}\n   描述: ${r.description || "无"}\n   语言: ${r.language || "未知"}\n   Topics: ${(r.topics || []).join(", ") || "无"}`
    )
    .join("\n\n");

  try {
    const result = await deepseekChatJSON<{
      relevant: string[];
      irrelevant: string[];
    }>({
      systemPrompt: RELEVANCE_FILTER_SYSTEM,
      userPrompt: `用户需求：${userInput}

以下是从 GitHub 搜索到的项目列表，请判断哪些与用户需求相关：

${repoList}

请输出 JSON:
{
  "relevant": ["owner/repo1", "owner/repo2"],
  "irrelevant": ["owner/repo3", "owner/repo4"]
}`,
      temperature: 0.1,
      maxTokens: 2000,
    });

    const relevant = new Set(result.relevant || []);
    const filteredOut = (result.irrelevant || []).length;
    if (filteredOut > 0) {
      console.log(
        `[relevance-filter] 过滤掉 ${filteredOut} 个无关项目，保留 ${relevant.size} 个`
      );
    }
    return relevant;
  } catch (err) {
    console.warn("[relevance-filter] AI 相关性过滤失败，保留全部:", err);
    // 失败时不过滤，保险起见保留全部
    return new Set(repos.map((r) => r.full_name));
  }
}

// ─── 并发控制 ───

/** 限制并发数的 Promise 池 */
async function asyncPool<T, R>(
  concurrency: number,
  items: T[],
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;

  async function worker(): Promise<void> {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── 综合评分入口 ───

export interface ScoringInput {
  userInput: string;
  repos: GitHubRepo[];
  readmeMap?: Map<string, string>;
}

/** 单仓库评分（硬指标 + AI） */
async function scoreSingleRepo(
  userInput: string,
  repo: GitHubRepo,
  readmeSummary: string | undefined,
  readmeText: string | undefined
): Promise<ScoredRepo> {
  // 硬指标（同步计算）
  const activityScore = calculateActivityScore(repo.pushed_at, repo.updated_at, repo.archived);
  const maturityScore = calculateMaturityScore(repo.stargazers_count, repo.forks_count, repo.created_at);
  const licenseScore = calculateLicenseScore(repo.license);
  const docsScore = calculateHeuristicDocsScore(readmeText);
  const maintenanceLabel = getMaintenanceLabel(repo.pushed_at, repo.updated_at, repo.archived);

  // AI 指标（并行 2 次调用）
  const [similarityResult, modifiabilityResult] = await Promise.all([
    aiScoreSimilarity(userInput, repo, readmeSummary),
    aiAssessModifiability(repo, readmeSummary),
  ]);

  // 综合评分
  const totalScore = Math.round(
    similarityResult.similarityScore * 0.35 +
    activityScore * 0.20 +
    maturityScore * 0.15 +
    licenseScore * 0.10 +
    docsScore * 0.10 +
    modifiabilityResult.modifiabilityScore * 0.10
  );

  return {
    repo,
    readmeSummary: readmeSummary || undefined,
    similarityScore: similarityResult.similarityScore,
    activityScore,
    maturityScore,
    licenseScore,
    docsScore,
    modifiabilityScore: modifiabilityResult.modifiabilityScore,
    totalScore,
    maintenanceLabel,
    recommendation: similarityResult.reuseLevel,
    aiReason: similarityResult.reason,
  };
}

export async function scoreRepos(input: ScoringInput): Promise<ScoredRepo[]> {
  const { userInput, repos } = input;

  if (repos.length === 0) return [];

  // Step 1: 相关性批量预筛选（一次 AI 调用过滤无关项目）
  const relevantSet = await filterRelevantRepos(userInput, repos);
  const relevantRepos = repos.filter((r) => relevantSet.has(r.full_name));

  if (relevantRepos.length === 0) {
    console.log("[scoring] 所有项目被相关性过滤，保留 Top 3 避免空结果");
    // 至少保留 3 个避免前端空白
    relevantRepos.push(...repos.slice(0, 3));
  }

  // Step 2: 读取 README
  const readmeMap = input.readmeMap || new Map<string, string>();

  // Step 3: 生成 README 摘要（仅对相关仓库）
  const summaryMap = await summarizeReadmes(relevantRepos, readmeMap);

  // Step 4: 并发评分（限制 5 个仓库并行，每个仓库内部 2 次 AI 调用也并行）
  const scoredRepos = await asyncPool(5, relevantRepos, (repo) => {
    const readmeSummary = summaryMap.get(repo.full_name);
    const readmeText = readmeMap.get(repo.full_name);
    return scoreSingleRepo(userInput, repo, readmeSummary, readmeText);
  });

  // 按总分降序
  scoredRepos.sort((a, b) => b.totalScore - a.totalScore);

  return scoredRepos;
}
