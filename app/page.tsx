"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import DevPromptBox from "@/components/DevPromptBox";
import FilterPanel from "@/components/FilterPanel";
import RepoCard from "@/components/RepoCard";
import RepoCompareTable from "@/components/RepoCompareTable";
import RequirementInput from "@/components/RequirementInput";
import SearchKeywords from "@/components/SearchKeywords";
import type {
  DevPromptResult,
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
  const [experienceMeta, setExperienceMeta] = useState<ExperienceMeta>({});
  const [starCta, setStarCta] = useState<StarCta>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllRepos, setShowAllRepos] = useState(false);

  const isLoading = phase === "investigating";
  const top3 = useMemo(() => repos.slice(0, 3), [repos]);
  const visibleRepos = useMemo(() => (showAllRepos ? repos : repos.slice(0, 5)), [repos, showAllRepos]);

  useEffect(() => {
    async function loadExperienceMeta() {
      try {
        const response = await fetch(withBasePath("/api/health"));
        const data = (await response.json()) as {
          experience_mode?: "local" | "hosted";
          experience_window_hours?: number | null;
          experience_window_limit?: number | null;
        };

        if (!response.ok || !data.experience_mode) return;

        setExperienceMeta((current) =>
          current.mode
            ? current
            : {
                mode: data.experience_mode,
                windowHours: data.experience_window_hours ?? null,
                windowLimit: data.experience_window_limit ?? null,
                used: null,
                remaining: null,
              },
        );
      } catch {
        // Keep the page usable even if the lightweight status probe fails.
      }
    }

    void loadExperienceMeta();
  }, []);

  const handleSearch = async (input: string) => {
    setUserInput(input);
    setError(null);
    setAnalysis(null);
    setRepos([]);
    setDevPromptResult(null);
    setMarkdownReport("");
    setStarCta(null);
    setShowAllRepos(false);
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
      ? `当前窗口已用 ${experienceMeta.used ?? 0} / ${experienceMeta.windowLimit ?? 0} 次，剩余 ${experienceMeta.remaining ?? 0} 次`
      : "当前为本地完整模式";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#17304d_0%,#0f1117_38%,#0b0e14_100%)]">
      <header className="sticky top-0 z-20 border-b border-[#243145] bg-[#0d1119]/84 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image
              src={withBasePath("/devdetective-logo.png")}
              alt="DevDetective logo"
              width={286}
              height={382}
              className="h-9 w-auto shrink-0"
              priority
            />
            <div>
              <div className="text-sm font-semibold text-[#edf2ff]">DevDetective</div>
              <div className="hidden text-[11px] text-[#657791] sm:block">AI2Work Labs · Developer Tool</div>
            </div>
          </div>

          <nav className="flex items-center gap-3 text-xs text-[#8da0bb] sm:text-sm">
            <a href="#experience" className="transition-colors hover:text-white">
              在线体验
            </a>
            <a
              href="https://github.com/dadaleo/DevDetective"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              GitHub
            </a>
            <a
              href="#details"
              className="rounded-full border border-[#30425a] px-3 py-1 transition-colors hover:border-[#4b729d] hover:text-white"
            >
              更多说明
            </a>
          </nav>
        </div>
      </header>

      <section className="px-4 pb-8 pt-10 sm:pt-14">
        <div className="mx-auto grid w-full max-w-[1180px] gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#2f4056] bg-[#111927]/88 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#a5b6cc]">
              AI2Work Labs · Developer Tool
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-[#f4f7ff] sm:text-5xl">
              写代码前，先查 GitHub 有没有成熟轮子
            </h1>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.32em] text-[#72b8ff]">
              Search GitHub Before You Build
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#99a7bb] sm:text-base">
              输入你的应用想法，AI Dev Detective 会自动搜索相似开源项目，比较最近更新、维护状态、License
              和可复用性，并生成 Codex-ready 开发提示词。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#experience"
                className="rounded-full bg-[linear-gradient(135deg,#3d7cff,#2ec5b6)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_28px_rgba(45,123,255,0.22)] transition-transform hover:-translate-y-0.5"
              >
                进入在线侦查台
              </a>
              <a
                href="https://github.com/dadaleo/DevDetective"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#31445e] px-5 py-2.5 text-sm text-[#a5b6cc] transition-colors hover:border-[#4d6f97] hover:text-white"
              >
                查看 GitHub 仓库
              </a>
            </div>
          </div>

          <aside className="rounded-[28px] border border-[#304059] bg-[linear-gradient(180deg,rgba(17,24,35,0.96),rgba(10,15,22,0.92))] p-6 shadow-[0_24px_60px_rgba(3,7,18,0.24)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#62748d]">Workflow</p>
                <h2 className="mt-1 text-lg font-semibold text-[#eef3ff]">轻量侦查流程</h2>
              </div>
              <span className="rounded-full border border-[#31445e] bg-[#111a28] px-3 py-1 text-[11px] text-[#97aac6]">
                Product Entry
              </span>
            </div>

            <div className="rounded-[20px] border border-[#2d3a4e] bg-[#101722] p-4">
              <div className="text-sm font-medium text-[#eef3ff]">Idea → GitHub Search → Repo Score → Codex Prompt</div>
              <div className="mt-4 grid gap-3">
                {[
                  "输入应用想法，先把需求翻成可搜索的开源线索",
                  "自动比较维护状态、最近更新和 License 风险",
                  "给出 Top 3 推荐与可直接喂给 Codex 的提示词",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#4fd1c5]" />
                    <p className="text-sm leading-6 text-[#9aa8bc]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] border border-[#2d3a4e] bg-[#101722] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#61738d]">Result Focus</div>
                <div className="mt-2 text-sm font-medium text-[#edf2ff]">Top 3 + Codex Prompt</div>
              </div>
              <div className="rounded-[18px] border border-[#2d3a4e] bg-[#101722] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#61738d]">Fit</div>
                <div className="mt-2 text-sm font-medium text-[#edf2ff]">AI2Work Hosted Demo</div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="experience" className="px-4 pb-8">
        <div className="mx-auto grid w-full max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="space-y-4">
            <RequirementInput onSearch={handleSearch} isLoading={isLoading} />
            <FilterPanel filters={filters} onChange={setFilters} disabled={isLoading} />
          </div>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-[#2b394d] bg-[#101722]/90 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#62748d]">Current Mode</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#edf2ff]">
                    {experienceMeta.mode === "hosted" ? "AI2Work Hosted Demo" : "Developer Workbench"}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] ${
                    experienceMeta.mode === "hosted"
                      ? "bg-[#12354a] text-[#7ed9ff]"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {experienceMeta.mode === "hosted" ? "Hosted" : "Local"}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#98a7be]">{hostedStatusText}</p>
              {experienceMeta.mode === "hosted" && (
                <p className="mt-2 text-xs leading-5 text-[#5f718c]">
                  当前限制：同一 IP 每 {experienceMeta.windowHours ?? 6} 小时最多侦查 {experienceMeta.windowLimit ?? 2} 次。
                </p>
              )}

              <div className="mt-4 grid gap-3">
                {(phase === "done"
                  ? [
                      `${repos.length} 个候选仓库已完成打分`,
                      top3.length > 0 ? `Top ${top3.length} 已整理成优先推荐` : "等待侦查结果",
                      devPromptResult?.devPrompt ? "Codex Prompt 已生成，可直接复制" : "结果将生成可复用提示词",
                    ]
                  : [
                      "上半部分保持产品入口感，首屏只放核心转化",
                      "下半部分进入开发者工具体验台，避免冗长说明先占空间",
                      "结果优先给结论、Top 3、Prompt，再决定是否展开更多仓库",
                    ]
                ).map((item) => (
                  <div key={item} className="rounded-[18px] border border-[#2a3749] bg-[#0d141e] px-4 py-3 text-sm text-[#9aa8bc]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {isLoading && (
        <section className="px-4 pb-8">
          <div className="mx-auto flex w-full max-w-[1180px] justify-center">
            <div className="glass-card inline-flex flex-col items-center gap-3 p-8">
              <svg className="h-8 w-8 animate-spin text-primary-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-[#8b92a5]">正在执行统一侦查流程：需求分析、GitHub 搜索、仓库评分和 Prompt 生成...</p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="px-4 pb-8">
          <div className="mx-auto w-full max-w-[1180px] rounded-[22px] border border-red-500/30 bg-red-500/5 p-5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </section>
      )}

      {phase === "done" && (
        <section className="px-4 pb-12">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
            {devPromptResult?.summary && (
              <div className="rounded-[24px] border border-[#2f4158] bg-[#121a27]/92 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#6480a2]">Detective Conclusion</p>
                <h3 className="mt-2 text-xl font-semibold text-[#eef3ff]">侦探结论</h3>
                <p className="mt-3 text-sm leading-7 text-[#9aabc0]">{devPromptResult.summary}</p>
              </div>
            )}

            {analysis?.intentSummary && (
              <div className="rounded-[22px] border border-[#2a3748] bg-[#101722]/84 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#62748d]">Requirement Snapshot</p>
                <p className="mt-3 text-sm leading-7 text-[#97a4ba]">{analysis.intentSummary}</p>
              </div>
            )}

            {top3.length > 0 && (
              <div className="rounded-[24px] border border-[#2a394d] bg-[#121a27]/88 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#62748d]">Top Picks</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#eef3ff]">Top 3 推荐</h3>
                  </div>
                  <span className="rounded-full border border-[#30425a] px-3 py-1 text-xs text-[#97a4ba]">优先可复用仓库</span>
                </div>
                <RepoCompareTable repos={top3} />
              </div>
            )}

            {starCta?.show && (
              <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/5 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-amber-200">这次体验如果对你有帮助</h3>
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

            {devPromptResult && (
              <div className="rounded-[24px] border border-[#2a394d] bg-[#121a27]/88 p-1">
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
              </div>
            )}

            {markdownReport && (
              <div className="flex justify-center">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-full border border-[#30425a] bg-[#101722] px-4 py-2 text-sm text-[#a6b7cc] transition-colors hover:border-[#4d6f97] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  导出 Markdown
                </button>
              </div>
            )}

            {analysis && (
              <SearchKeywords
                coreFeatures={analysis.coreFeatures || []}
                searchQueries={analysis.searchQueries || []}
                onRegenerate={handleRegenerateKeywords}
              />
            )}

            {repos.length > 0 && (
              <div className="rounded-[24px] border border-[#2a394d] bg-[#121a27]/88 p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#62748d]">Candidate Repositories</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#eef3ff]">候选仓库</h3>
                  </div>
                  <span className="text-xs text-[#6f8199]">默认展示前 5 个，其余可按需展开</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {visibleRepos.map((repo, index) => (
                    <RepoCard key={repo.repo.full_name} repo={repo} rank={index + 1} />
                  ))}
                </div>

                {repos.length > 5 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllRepos((value) => !value)}
                      className="rounded-full border border-[#30425a] bg-[#101722] px-4 py-2 text-sm text-[#a6b7cc] transition-colors hover:border-[#4d6f97] hover:text-white"
                    >
                      {showAllRepos ? "收起更多候选仓库" : "展开更多候选仓库"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section id="details" className="px-4 pb-14">
        <div className="mx-auto grid w-full max-w-[1180px] gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border border-[#2a394d] bg-[#111722]/82 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#62748d]">Card 01</p>
            <h3 className="mt-2 text-lg font-semibold text-[#eef3ff]">Codex / Agent Skill</h3>
            <p className="mt-3 text-sm leading-7 text-[#97a4ba]">让 Agent 在写代码前先做 GitHub 侦查。</p>
          </div>

          <div className="rounded-[22px] border border-[#2a394d] bg-[#111722]/82 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#62748d]">Card 02</p>
            <h3 className="mt-2 text-lg font-semibold text-[#eef3ff]">AI2Work Hosted Demo</h3>
            <p className="mt-3 text-sm leading-7 text-[#97a4ba]">作为在线体验入口、案例展示页和托管版导流页。</p>
          </div>

          <div className="rounded-[22px] border border-[#2a394d] bg-[#111722]/82 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#62748d]">Card 03</p>
            <h3 className="mt-2 text-lg font-semibold text-[#eef3ff]">Local / Open Source</h3>
            <p className="mt-3 text-sm leading-7 text-[#97a4ba]">适合团队内部持续调研、二次开发和私有部署验证。</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#233145] py-8 text-center text-xs text-[#5f718c]">
        <div className="mx-auto max-w-[1180px] px-4">
          DevDetective · Developer Tool for AI builders · Hosted at ai2work.xyz/DevDetective
        </div>
      </footer>
    </main>
  );
}
