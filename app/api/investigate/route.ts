import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { deepseekChatJSON, isDeepSeekConfigured } from "@/lib/ai/deepseek";
import {
  ANALYZE_REQUIREMENT_SYSTEM,
  buildAnalyzeRequirementPrompt,
  GENERATE_DEV_PROMPT_SYSTEM,
  buildGenerateDevPrompt,
} from "@/lib/ai/prompts";
import { batchFetchReadmes, isGitHubConfigured, multiSearchRepos } from "@/lib/github";
import { countUsageSince, logUsage, saveRepoResults, saveReport, saveSearchSession } from "@/lib/cache";
import { generateMarkdownReport } from "@/lib/report";
import { filterSafeRepos } from "@/lib/safety";
import { scoreRepos } from "@/lib/scoring";
import type { GitHubRepo, InvestigateInput } from "@/lib/types";

type InvestigateAnalysis = {
  intentSummary: string;
  coreFeatures?: string[];
  keywordsCn?: string[];
  keywordsEn?: string[];
  searchQueries: string[];
};

function applyFilters(repos: GitHubRepo[], input: InvestigateInput): GitHubRepo[] {
  return repos.filter((repo) => {
    const text = `${repo.name} ${repo.full_name} ${repo.description || ""} ${(repo.topics || []).join(" ")}`
      .toLowerCase();
    const language = repo.language?.toLowerCase() || "";
    const techFilter = input.techStack?.[0]?.toLowerCase();
    const licenseFilter = input.licensePreference || "";

    if (techFilter && !text.includes(techFilter) && language !== techFilter) {
      return false;
    }

    if (licenseFilter) {
      const spdx = repo.license?.spdx_id?.toLowerCase() || "";
      if (licenseFilter.includes("MIT") && !["mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause"].includes(spdx)) {
        return false;
      }
      if (licenseFilter.includes("商用") && (!spdx || spdx.includes("gpl") || spdx.includes("agpl"))) {
        return false;
      }
    }

    return true;
  });
}

function getHostedExperienceConfig() {
  const hostedMode = process.env.HOSTED_EXPERIENCE_MODE === "true";
  const windowHours = Number(process.env.HOSTED_LIMIT_WINDOW_HOURS || 6);
  const windowLimit = Number(process.env.HOSTED_MAX_QUERIES_PER_WINDOW || 2);
  const maxResults = Number(process.env.HOSTED_MAX_RESULTS || 5);
  return { hostedMode, windowHours, windowLimit, maxResults };
}

function getRequestIdentity(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") || "unknown-user-agent";
  const rawIdentity = forwardedFor?.split(",")[0].trim() || realIp || userAgent;
  return crypto.createHash("sha256").update(rawIdentity).digest("hex");
}

function startOfWindowIso(windowHours: number): string {
  const now = Date.now();
  return new Date(now - windowHours * 60 * 60 * 1000).toISOString();
}

export async function POST(request: NextRequest) {
  const usageId = crypto.randomUUID();
  const requestIdentity = getRequestIdentity(request);

  try {
    const body: InvestigateInput = await request.json();
    const {
      idea,
      techStack,
      projectType,
      updatePreference,
      preferRecent,
      maxResults = 10,
      outputFormat = "json",
    } = body;

    if (!idea || idea.trim().length < 10) {
      return NextResponse.json({ error: "请输入至少 10 个字的需求描述。" }, { status: 400 });
    }

    if (!isGitHubConfigured()) {
      return NextResponse.json({ error: "GitHub Token 未配置，请先设置 GITHUB_TOKEN。" }, { status: 500 });
    }

    if (!isDeepSeekConfigured()) {
      return NextResponse.json({ error: "AI API 未配置，请先设置 DEEPSEEK_API_KEY。" }, { status: 500 });
    }

    const { hostedMode, windowHours, windowLimit, maxResults: hostedMaxResults } = getHostedExperienceConfig();
    const windowStartIso = startOfWindowIso(windowHours);
    const usedInWindow =
      hostedMode && requestIdentity
        ? await countUsageSince({
            requestType: "investigate",
            userId: requestIdentity,
            sinceIso: windowStartIso,
          })
        : 0;

    if (hostedMode && requestIdentity && usedInWindow >= windowLimit) {
      return NextResponse.json(
        {
          error: `当前体验版限制为同一 IP 每 ${windowHours} 小时最多查询 ${windowLimit} 次。你本时间窗口的次数已用完，请稍后再试，或使用本地开源版。`,
        },
        { status: 429 }
      );
    }

    const sessionId = crypto.randomUUID();
    const reportId = crypto.randomUUID();
    const normalizedIdea = idea.trim();
    const effectiveUpdatePreference = updatePreference || (preferRecent ? "最近 1 年有更新" : undefined);
    const effectiveMaxResults = hostedMode ? Math.min(maxResults, hostedMaxResults) : maxResults;

    const analysisPrompt = buildAnalyzeRequirementPrompt(
      normalizedIdea,
      techStack?.[0],
      projectType,
      effectiveUpdatePreference
    );

    const analysis = await deepseekChatJSON<InvestigateAnalysis>({
      systemPrompt: ANALYZE_REQUIREMENT_SYSTEM,
      userPrompt: analysisPrompt,
      maxTokens: 2048,
    });

    const rawRepos = await multiSearchRepos(analysis.searchQueries || [], Math.max(effectiveMaxResults, 12));
    const filteredRepos = applyFilters(rawRepos, body);
    const { safe: repos } = filterSafeRepos(filteredRepos);
    const readmeMap = await batchFetchReadmes(repos, 20);
    const scoredRepos = await scoreRepos({ userInput: normalizedIdea, repos, readmeMap });
    const limitedRepos = scoredRepos.slice(0, effectiveMaxResults);
    const topRecommendations = limitedRepos.slice(0, 3);

    const promptInput = buildGenerateDevPrompt(
      normalizedIdea,
      topRecommendations.map((repo) => ({
        fullName: repo.repo.full_name,
        url: repo.repo.html_url,
        description: repo.repo.description || "无描述",
        language: repo.repo.language || "未知",
        readmeSummary: repo.readmeSummary,
      }))
    );

    const promptResult = await deepseekChatJSON<{
      summary: string;
      devPrompt: string;
      userGoal?: string;
      baseProject?: string;
      whyThisProject?: string;
      keepCapabilities?: string[];
      addCapabilities?: string[];
      avoidIssues?: string[];
      devSteps?: string[];
      checkCriteria?: string[];
    }>({
      systemPrompt: GENERATE_DEV_PROMPT_SYSTEM,
      userPrompt: promptInput,
      maxTokens: 4096,
    });

    const markdownReport = generateMarkdownReport({
      title: `DevDetective: ${normalizedIdea.slice(0, 30)}`,
      userInput: normalizedIdea,
      intentSummary: analysis.intentSummary || "",
      searchQueries: analysis.searchQueries || [],
      scoredRepos: limitedRepos,
      aiConclusion: promptResult.summary || "",
      devPrompt: promptResult.devPrompt || "",
      generatedAt: new Date().toISOString(),
    });

    await saveSearchSession(
      sessionId,
      normalizedIdea,
      JSON.stringify({
        techStack,
        projectType,
        updatePreference: effectiveUpdatePreference,
        licensePreference: body.licensePreference,
        preferLightweight: body.preferLightweight || false,
      }),
      JSON.stringify(analysis.searchQueries || [])
    );

    await saveRepoResults(
      sessionId,
      limitedRepos.map((repo) => ({
        id: crypto.randomUUID(),
        full_name: repo.repo.full_name,
        html_url: repo.repo.html_url,
        description: repo.repo.description,
        language: repo.repo.language,
        stars: repo.repo.stargazers_count,
        forks: repo.repo.forks_count,
        open_issues: repo.repo.open_issues_count,
        license: repo.repo.license?.spdx_id || null,
        created_at: repo.repo.created_at,
        updated_at: repo.repo.updated_at,
        pushed_at: repo.repo.pushed_at,
        archived: repo.repo.archived ? 1 : 0,
        homepage: repo.repo.homepage,
        topics_json: JSON.stringify(repo.repo.topics || []),
        readme_summary: repo.readmeSummary || null,
        similarity_score: repo.similarityScore,
        activity_score: repo.activityScore,
        total_score: repo.totalScore,
        recommendation: repo.recommendation,
      }))
    );

    await saveReport(reportId, sessionId, `DevDetective: ${normalizedIdea.slice(0, 30)}`, markdownReport);

    await logUsage({
      id: usageId,
      requestType: "investigate",
      userId: requestIdentity,
      userInput: normalizedIdea,
      githubRequestCount: analysis.searchQueries?.length || 0,
      aiTokenEstimate: 0,
    });

    const experienceUsed = hostedMode && requestIdentity ? usedInWindow + 1 : null;
    const experienceRemaining =
      hostedMode && typeof experienceUsed === "number"
        ? Math.max(0, windowLimit - experienceUsed)
        : null;
    const showStarCta = hostedMode && experienceUsed === windowLimit;

    return NextResponse.json({
      sessionId,
      intentSummary: analysis.intentSummary || "",
      searchKeywords: analysis.searchQueries || [],
      repos: limitedRepos,
      topRecommendations,
      reuseAdvice: promptResult.summary || "",
      codexPrompt: promptResult.devPrompt || "",
      markdownReport: hostedMode && outputFormat !== "markdown" ? "" : markdownReport,
      experienceMode: hostedMode ? "hosted" : "local",
      experienceWindowHours: hostedMode ? windowHours : null,
      experienceWindowLimit: hostedMode ? windowLimit : null,
      experienceUsed,
      experienceRemaining,
      starCta: showStarCta
        ? {
            show: true,
            repoUrl: "https://github.com/dadaleo/DevDetective",
            message:
              "这已经是你当前 6 小时窗口内的第 2 次体验。如果这个方向对你有帮助，欢迎去 GitHub 给 DevDetective 点一个 Star，能帮项目走得更远。",
          }
        : null,
      userGoal: promptResult.userGoal || "",
      baseProject: promptResult.baseProject || "",
      whyThisProject: promptResult.whyThisProject || "",
      keepCapabilities: promptResult.keepCapabilities || [],
      addCapabilities: promptResult.addCapabilities || [],
      avoidIssues: promptResult.avoidIssues || [],
      devSteps: promptResult.devSteps || [],
      checkCriteria: promptResult.checkCriteria || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "侦查失败";
    console.error("/api/investigate error:", err);

    try {
      await logUsage({
        id: usageId,
        requestType: "investigate",
        userId: requestIdentity,
        success: false,
        errorMessage: message,
      });
    } catch (logErr) {
      console.warn("[investigate] log usage failed:", logErr);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
