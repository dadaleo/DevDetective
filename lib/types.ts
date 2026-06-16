// ─── GitHub 仓库原始数据 ───
export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id: string; name: string } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  archived: boolean;
  disabled: boolean;
  topics: string[];
  homepage: string | null;
}

// ─── 维护状态 ───
export type MaintenanceLabel =
  | "非常活跃"
  | "活跃"
  | "正常维护"
  | "低频维护"
  | "维护风险"
  | "疑似停更"
  | "已归档";

// ─── 推荐动作 ───
export type RecommendationAction =
  | "建议 fork 改造"
  | "适合参考架构"
  | "适合参考 UI"
  | "适合借鉴局部功能"
  | "仅供调研"
  | "不建议使用";

// ─── 评分后的仓库 ───
export interface ScoredRepo {
  repo: GitHubRepo;
  readmeSummary?: string;
  similarityScore: number; // 0-100
  activityScore: number; // 0-100
  maturityScore: number; // 0-100
  licenseScore: number; // 0-100
  docsScore: number; // 0-100
  modifiabilityScore: number; // 0-100
  totalScore: number; // 0-100
  maintenanceLabel: MaintenanceLabel;
  recommendation: RecommendationAction;
  aiReason: string;
}

// ─── 搜索筛选条件 ───
export interface SearchFilters {
  techStack?: string;
  projectType?: string;
  updatePreference?: string;
  licensePreference?: string;
  preferLightweight?: boolean;
  preferRecent?: boolean;
}

// ─── 需求拆解结果 ───
export interface RequirementAnalysis {
  intentSummary: string;
  coreFeatures: string[];
  keywordsCn: string[];
  keywordsEn: string[];
  searchQueries: string[];
}

// ─── AI 开发提示词结果（二期结构化） ───
export interface DevPromptResult {
  summary: string;
  devPrompt: string;
  // 结构化字段（二期新增）
  userGoal?: string;
  baseProject?: string;
  whyThisProject?: string;
  keepCapabilities?: string[];
  addCapabilities?: string[];
  avoidIssues?: string[];
  devSteps?: string[];
  checkCriteria?: string[];
}

// ─── Markdown 报告 ───
export interface InvestigationReport {
  title: string;
  userInput: string;
  intentSummary: string;
  searchQueries: string[];
  scoredRepos: ScoredRepo[];
  aiConclusion: string;
  devPrompt: string;
  generatedAt: string;
}

// ─── 统一侦查请求/响应 ───
export interface InvestigateInput {
  idea: string;
  techStack?: string[];
  projectType?: string;
  updatePreference?: string;
  licensePreference?: string;
  preferLightweight?: boolean;
  preferRecent?: boolean;
  maxResults?: number;
  outputFormat?: "json" | "markdown";
}

export interface InvestigateOutput {
  sessionId?: string;
  intentSummary: string;
  searchKeywords: string[];
  repos: ScoredRepo[];
  topRecommendations: ScoredRepo[];
  reuseAdvice: string;
  codexPrompt: string;
  markdownReport?: string;
  experienceMode?: "local" | "hosted";
  experienceDailyLimit?: number | null;
  experienceRemaining?: number | null;
}

// ─── 示例案例 ───
export interface ExampleCase {
  id: string;
  title: string;
  description: string;
  inputText: string;
  tags: string[];
}
