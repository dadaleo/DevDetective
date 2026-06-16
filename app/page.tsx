"use client";

import { useEffect, useMemo, useState } from "react";
import DevPromptBox from "@/components/DevPromptBox";
import FilterPanel from "@/components/FilterPanel";
import RepoCard from "@/components/RepoCard";
import RepoCompareTable from "@/components/RepoCompareTable";
import RequirementInput from "@/components/RequirementInput";
import SearchKeywords from "@/components/SearchKeywords";
import type {
  DevPromptResult,
  ExampleCase,
  InvestigateOutput,
  RequirementAnalysis,
  ScoredRepo,
  SearchFilters,
} from "@/lib/types";

type SearchPhase = "idle" | "investigating" | "done";

type ExperienceMeta = {
  mode?: "local" | "hosted";
  windowHours?: number | null;
  windowLimit?: number | null;
  used?: number | null;
  remaining?: number | null;
};

type StarCta = {
  show: boolean;
  repoUrl: string;
  message: string;
} | null;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function withBasePath(path: string) {
  if (!basePath) return path;
  return `${basePath}${path}`;
}

function toInvestigatePayload(input: string, filters: SearchFilters) {
  return {
    idea: input,
    techStack: filters.techStack ? [filters.techStack] : undefined,
    projectType: filters.projectType || undefined,
    updatePreference: filters.updatePreference || undefined,
    licensePreference: filters.licensePreference || undefined,
    preferLightweight: filters.preferLightweight || false,
    preferRecent: filters.preferRecent || false,
    maxResults: 10,
    outputFormat: "markdown" as const,
  };
}

export default function Home() {
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [userInput, setUserInput] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [analysis, setAnalysis] = useState<RequirementAnalysis | null>(null);
  const [repos, setRepos] = useState<ScoredRepo[]>([]);
  const [devPromptResult, setDevPromptResult] = useState<DevPromptResult | null>(null);
  const [markdownReport, setMarkdownReport] = useState("");
  const [examples, setExamples] = useState<ExampleCase[]>([]);
  const [experienceMeta, setExperienceMeta] = useState<ExperienceMeta>({});
  const [starCta, setStarCta] = useState<StarCta>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = phase === "investigating";
  const top3 = useMemo(() => repos.slice(0, 3), [repos]);

  useEffect(() => {
    async function loadExamples() {
      try {
        const response = await fetch(withBasePath("/api/examples"));
        const data = await response.json();
        if (response.ok) {
          setExamples(data.examples || []);
        }
      } catch {
        // Ignore example loading failures in hosted demo mode.
      }
    }

    void loadExamples();
  }, []);

  const handleSearch = async (input: string) => {
    setUserInput(input);
    setError(null);
    setAnalysis(null);
    setRepos([]);
    setDevPromptResult(null);
    setMarkdownReport("");
    setStarCta(null);
    setPhase("investigating");

    try {
      const response = await fetch(withBasePath("/api/investigate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toInvestigatePayload(input, filters)),
      });

      const data = (await response.json()) as InvestigateOutput & {
        error?: string;
        userGoal?: string;
        baseProject?: string;
        whyThisProject?: string;
        keepCapabilities?: string[];
        addCapabilities?: string[];
        avoidIssues?: string[];
        devSteps?: string[];
        checkCriteria?: string[];
      };

      if (!response.ok) {
        throw new Error(data.error || "侦查失败");
      }

      setAnalysis({
        intentSummary: data.intentSummary || "",
        coreFeatures: [],
        keywordsCn: [],
        keywordsEn: [],
        searchQueries: data.searchKeywords || [],
      });
      setRepos(data.repos || []);
      setDevPromptResult({
        summary: data.reuseAdvice || "",
        devPrompt: data.codexPrompt || "",
        userGoal: data.userGoal || "",
        baseProject: data.baseProject || "",
        whyThisProject: data.whyThisProject || "",
        keepCapabilities: data.keepCapabilities || [],
        addCapabilities: data.addCapabilities || [],
        avoidIssues: data.avoidIssues || [],
        devSteps: data.devSteps || [],
        checkCriteria: data.checkCriteria || [],
      });
      setMarkdownReport(data.markdownReport || "");
      setExperienceMeta({
        mode: data.experienceMode,
        windowHours: data.experienceWindowHours,
        windowLimit: data.experienceWindowLimit,
        used: data.experienceUsed,
        remaining: data.experienceRemaining,
      });
      setStarCta(data.starCta || null);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setPhase("idle");
    }
  };

  const handleRegenerateKeywords = async () => {
    if (!userInput) return;

    setError(null);
    setPhase("investigating");

    try {
      const response = await fetch(withBasePath("/api/analyze-requirement"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput, filters, regenerate: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "重新生成关键词失败");
      }

      setAnalysis(data);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setPhase("done");
    }
  };

  const handleExport = () => {
    if (!markdownReport) return;

    const blob = new Blob([markdownReport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `devdetective-report-${date}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const hostedStatusText =
    experienceMeta.mode === "hosted"
      ? `当前窗口已用 ${experienceMeta.used ?? 0} / ${experienceMeta.windowLimit ?? 0} 次，剩余 ${
          experienceMeta.remaining ?? 0
        } 次`
      : "当前为本地完整版模式";

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[#2d3343] bg-[#1a1d27]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">DD</span>
            <div>
              <div className="text-sm font-semibold text-[#e4e7ee]">DevDetective</div>
              <div className="hidden text-[11px] text-[#5c6378] sm:block">开发者侦探</div>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-xs text-[#8b92a5] sm:text-sm">
            <a href="#experience" className="transition-colors hover:text-[#e4e7ee]">
              在线体验
            </a>
            <a
              href="https://github.com/dadaleo/DevDetective"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#e4e7ee]"
            >
              GitHub
            </a>
            <a
              href="#ai2work"
              className="rounded-full border border-[#2d3343] px-3 py-1 transition-colors hover:border-primary-500/40 hover:text-[#e4e7ee]"
            >
              AI2Work
            </a>
          </nav>
        </div>
      </header>

      <section className="px-4 pb-10 pt-16 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#5c6378]">
            Search GitHub Before You Build
          </p>
          <h1 className="mb-4 text-3xl font-bold sm:text-5xl">
            <span className="gradient-text">写代码前，先查 GitHub 有没有成熟轮子</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[#8b92a5] sm:text-base">
            输入你的应用想法，DevDetective 会先做开源侦查，再告诉你更适合 fork、参考，还是从零开发。
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <a
              href="#experience"
              className="rounded-full bg-primary-600 px-5 py-2 text-white transition-colors hover:bg-primary-500"
            >
              开始在线体验
            </a>
            <a
              href="https://github.com/dadaleo/DevDetective"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#2d3343] px-5 py-2 text-[#8b92a5] transition-colors hover:border-primary-500/40 hover:text-[#e4e7ee]"
            >
              查看 GitHub
            </a>
            <a
              href="#ai2work"
              className="rounded-full border border-[#2d3343] px-5 py-2 text-[#8b92a5] transition-colors hover:border-primary-500/40 hover:text-[#e4e7ee]"
            >
              AI2Work 部署
            </a>
          </div>
        </div>
      </section>

      <section id="experience" className="mx-auto max-w-6xl px-4 pb-8">
        <div className="mx-auto mb-4 max-w-2xl rounded-lg border border-[#2d3343]/50 bg-[#11141c] px-4 py-3 text-xs text-[#8b92a5]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>体验版用于快速验证需求方向，不替代本地开源完整版。</span>
            {experienceMeta.mode === "hosted" ? (
              <span className="rounded-full bg-primary-500/10 px-2.5 py-1 text-primary-300">{hostedStatusText}</span>
            ) : (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-300">{hostedStatusText}</span>
            )}
          </div>
          {experienceMeta.mode === "hosted" && (
            <p className="mt-2 text-[11px] leading-5 text-[#5c6378]">
              当前限制：同一 IP 每 {experienceMeta.windowHours ?? 6} 小时最多查询 {experienceMeta.windowLimit ?? 2} 次。
            </p>
          )}
        </div>

        <RequirementInput onSearch={handleSearch} isLoading={isLoading} />

        <div className="mx-auto mt-4 max-w-2xl">
          <FilterPanel filters={filters} onChange={setFilters} disabled={isLoading} />
        </div>
      </section>

      {examples.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#5c6378]">Case Library</p>
              <h2 className="mt-1 text-xl font-semibold text-[#e4e7ee]">内置案例</h2>
            </div>
            <p className="max-w-md text-right text-xs leading-6 text-[#5c6378]">
              先用接近的案例试水，再把你自己的真实需求补进去，会更快看到结果质量。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => void handleSearch(example.inputText)}
                className="glass-card p-5 text-left transition-all hover:border-primary-500/30 hover:bg-[#202431]"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-base font-medium text-[#e4e7ee]">{example.title}</h3>
                  <span className="rounded-full border border-[#2d3343] px-2 py-0.5 text-[11px] text-[#5c6378]">
                    一键侦查
                  </span>
                </div>
                <p className="mb-3 text-sm leading-6 text-[#8b92a5]">{example.description}</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {example.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#1a1d27] px-2 py-1 text-[11px] text-[#5c6378]">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="line-clamp-3 text-xs leading-6 text-[#5c6378]">{example.inputText}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {isLoading && (
        <section className="mx-auto max-w-6xl px-4 pb-8 text-center">
          <div className="glass-card inline-flex flex-col items-center gap-3 p-8">
            <svg className="h-8 w-8 animate-spin text-primary-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-[#8b92a5]">正在执行统一侦查流程：需求分析、搜索、评分、总结与报告生成...</p>
          </div>
        </section>
      )}

      {error && (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="glass-card border border-red-500/30 bg-red-500/5 p-5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </section>
      )}

      {phase === "done" && (
        <section className="mx-auto max-w-6xl space-y-4 px-4 pb-16">
          {analysis && (
            <div className="rounded-lg border border-[#2d3343]/50 bg-[#1a1d27]/50 px-5 py-4">
              <h3 className="mb-2 text-sm font-medium text-[#8b92a5]">需求画像</h3>
              <p className="text-sm leading-relaxed text-[#8b92a5]">{analysis.intentSummary}</p>
            </div>
          )}

          {starCta?.show && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-amber-200">如果这次体验对你有帮助</h3>
                  <p className="mt-1 text-sm leading-6 text-amber-100/80">{starCta.message}</p>
                </div>
                <a
                  href={starCta.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-amber-400/40 px-4 py-2 text-center text-sm text-amber-200 transition-colors hover:bg-amber-400/10"
                >
                  去 GitHub 点个 Star
                </a>
              </div>
            </div>
          )}

          {analysis && (
            <SearchKeywords
              coreFeatures={analysis.coreFeatures || []}
              searchQueries={analysis.searchQueries || []}
              onRegenerate={handleRegenerateKeywords}
            />
          )}

          {top3.length > 0 && (
            <div className="rounded-lg border border-[#2d3343]/50 bg-[#1a1d27]/50 px-5 py-4">
              <h3 className="mb-4 text-sm font-medium text-[#8b92a5]">Top 3 推荐</h3>
              <RepoCompareTable repos={top3} />
            </div>
          )}

          {devPromptResult?.summary && (
            <div className="rounded-lg border border-l-2 border-[#2d3343]/50 border-l-primary-500/60 bg-[#1a1d27]/50 px-5 py-4">
              <h3 className="mb-3 text-sm font-medium text-[#8b92a5]">侦查结论</h3>
              <p className="text-sm leading-relaxed text-[#8b92a5]">{devPromptResult.summary}</p>
            </div>
          )}

          {repos.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-medium text-[#8b92a5]">候选仓库列表（{repos.length} 个）</h3>
                <span className="text-xs text-[#5c6378]">
                  {experienceMeta.mode === "hosted" ? "体验版默认展示 Top 5" : "本地版默认展示 Top 10"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {repos.map((repo, index) => (
                  <RepoCard key={repo.repo.full_name} repo={repo} rank={index + 1} />
                ))}
              </div>
            </div>
          )}

          {devPromptResult && (
            <>
              <DevPromptBox
                summary=""
                prompt={devPromptResult.devPrompt}
                onRegenerate={() => {
                  if (userInput) {
                    void handleSearch(userInput);
                  }
                }}
                disabled={isLoading}
              />

              <div className="flex justify-center">
                <button
                  onClick={handleExport}
                  disabled={!markdownReport}
                  className="flex items-center gap-1.5 text-xs text-[#5c6378] transition-colors hover:text-[#8b92a5] disabled:opacity-40"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  导出 Markdown 报告
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <footer className="border-t border-[#2d3343] py-8 text-center text-xs text-[#5c6378]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 text-left sm:text-center">
          <div className="glass-card px-5 py-4">
            <h3 className="mb-2 text-sm font-medium text-[#8b92a5]">Skill 使用</h3>
            <p className="text-xs leading-6 text-[#5c6378]">
              适合把 DevDetective 接入 Codex、Cursor、Claude Code 工作流，要求 Agent 在开始写代码前先做 GitHub 侦查。
            </p>
          </div>
          <div id="ai2work" className="glass-card px-5 py-4">
            <h3 className="mb-2 text-sm font-medium text-[#8b92a5]">AI2Work 部署定位</h3>
            <p className="text-xs leading-6 text-[#5c6378]">
              推荐部署到 `ai2work.xyz/devdetective` 或 `devdetective.ai2work.xyz`，作为在线体验入口、案例展示页和托管版导流页。
            </p>
          </div>
          <p>DevDetective · 开发者侦探 · 面向 AI 编程时代的开源侦查工具</p>
        </div>
      </footer>
    </main>
  );
}
