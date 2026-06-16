/**
 * AI Prompt 模板
 *
 * 集中管理所有 LLM 调用的 system prompt 和 user prompt 构建逻辑。
 */

// ─── 17.1 需求拆解 Prompt ───

export const ANALYZE_REQUIREMENT_SYSTEM = `你是一个开发需求分析助手。

请根据用户输入，提取这个应用想法的核心功能、可能技术栈、GitHub 搜索关键词。

要求：
1. 同时输出中文关键词和英文关键词；
2. 英文关键词要适合 GitHub 搜索；
3. 不要生成太宽泛的词；
4. 至少生成 5 组搜索 query；
5. 输出严格的 JSON 格式，不要包含 markdown 标记。`;

/** 将更新时间偏好转为 pushed 日期条件 */
function updatePreferenceToDate(updatePreference?: string): string | null {
  if (!updatePreference || updatePreference === "不限制") return null;
  const now = new Date();
  const monthsMap: Record<string, number> = {
    "最近 3 个月有更新": 3,
    "最近 6 个月有更新": 6,
    "最近 1 年有更新": 12,
    "最近 2 年有更新": 24,
  };
  const months = monthsMap[updatePreference];
  if (!months) return null;
  now.setMonth(now.getMonth() - months);
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function buildAnalyzeRequirementPrompt(
  userInput: string,
  techStackFilter?: string,
  projectTypeFilter?: string,
  updatePreference?: string
): string {
  let prompt = `用户输入：${userInput}`;

  if (techStackFilter && techStackFilter !== "不限") {
    prompt += `\n偏好技术栈：${techStackFilter}`;
  }
  if (projectTypeFilter && projectTypeFilter !== "不限") {
    prompt += `\n项目类型偏好：${projectTypeFilter}`;
  }

  const pushedDate = updatePreferenceToDate(updatePreference);
  if (pushedDate) {
    prompt += `\n更新时间要求：只搜索 ${pushedDate} 之后仍有代码推送的项目`;
  }

  prompt += `

请输出以下 JSON 结构:
{
  "intentSummary": "用中文一句话总结用户想开发什么",
  "coreFeatures": ["功能1", "功能2"],
  "keywordsCn": ["中文关键词1", "中文关键词2"],
  "keywordsEn": ["english keyword1", "english keyword2"],
  "searchQueries": ["完整 GitHub 搜索 query1", "完整 GitHub 搜索 query2"]
}

searchQueries 要求（非常重要，请严格遵循）：

1. 每组是一个可以直接用于 GitHub 搜索的英文查询字符串，长度 3-8 个词
2. 禁止使用过于宽泛的单词：tool, app, project, system, utility, software, application
3. 必须包含用户核心功能的技术描述词（如 "file sharing" "p2p transfer" "webRTC"）
4. 从多个角度生成搜索词：功能角度 / 技术实现角度 / 使用场景角度
5. 参考知名同类开源项目的命名风格和关键词（如文件传输场景参考 PairDrop、Snapdrop、ShareDrop、localsend 等项目的描述方式）
6. 如果用户指定了技术栈，在相关 query 中拼接 "language:TypeScript" 等条件
7. 对高质量项目增加 "stars:>50" 条件
8. 禁止生成可能返回政治、宗教、成人、暴力内容的搜索词`;

  if (pushedDate) {
    prompt += `\n9. 在相关 query 中拼接 "pushed:>${pushedDate}" 条件以过滤长期未更新的项目`;
  }

  prompt += `\n10. 至少 5 组，至多 8 组，每组聚焦不同搜索角度`;

  return prompt;
}

// ─── 17.2 项目相似度判断 Prompt ───

export const SCORE_SIMILARITY_SYSTEM = `你是一个开源项目分析助手。

请根据用户需求和 GitHub 项目信息，判断该项目是否适合作为开发参考。

你需要判断：
1. 功能是否相似；
2. 技术栈是否合适；
3. 是否可以直接 fork；
4. 是否只适合参考局部功能；
5. 是否不建议使用；
6. 简要说明原因。

请输出严格的 JSON 格式，不要包含 markdown 标记。`;

export function buildScoreSimilarityPrompt(
  userInput: string,
  projectInfo: string
): string {
  return `用户需求：${userInput}

项目信息：
${projectInfo}

请输出以下 JSON:
{
  "similarityScore": 0-100 (数字),
  "reuseLevel": "建议 fork 改造" | "适合参考架构" | "适合参考 UI" | "适合借鉴局部功能" | "仅供调研" | "不建议使用",
  "reason": "简短中文原因，50 字以内"
}`;
}

// ─── README 总结 Prompt ───

export const SUMMARIZE_README_SYSTEM = `你是一个开源项目分析助手。

请用 2-3 句中文简洁总结以下 README 内容，重点说明：
1. 这个项目是做什么的；
2. 用了什么技术栈；
3. 适合什么场景使用。`;

export function buildSummarizeReadmePrompt(readmeText: string): string {
  return `请总结以下 README 内容：\n\n${readmeText.slice(0, 8000)}`;
}

// ─── 17.3 AI 开发提示词生成（二期 8 段式结构化） ───

export const GENERATE_DEV_PROMPT_SYSTEM = `你是一个 AI 编程任务规划助手。

用户已经找到若干相似 GitHub 项目，请你根据用户需求和这些项目，生成一段可以交给 Cursor / Claude Code / Copilot / Codex 等 AI 编程工具的二次开发提示词。

请输出严格的 JSON 格式，不要包含 markdown 标记。

输出 JSON 必须包含以下所有字段：

{
  "summary": "200 字以内 AI 判断结论",
  "userGoal": "一句中文描述用户开发目标",
  "baseProject": "推荐的基础项目（owner/repo + URL）",
  "whyThisProject": "为什么选择这个项目作为基础（3 点以内）",
  "keepCapabilities": ["需要保留的能力1", "需要保留的能力2"],
  "addCapabilities": ["需要新增的能力1", "需要新增的能力2"],
  "avoidIssues": ["需要避免的问题1", "需要避免的问题2"],
  "devSteps": ["第1步：先阅读原项目 README","第2步：...","第3步：..."],
  "checkCriteria": ["检查标准1", "检查标准2"],
  "devPrompt": "完整的 Markdown 格式二次开发提示词，包含以上所有内容，可直接复制交给 AI 编程工具"
}`;

export function buildGenerateDevPrompt(
  userInput: string,
  topRepos: Array<{
    fullName: string;
    url: string;
    description: string;
    language: string;
    readmeSummary?: string;
  }>
): string {
  const reposText = topRepos
    .map(
      (r, i) =>
        `${i + 1}. ${r.fullName}\n   URL: ${r.url}\n   描述: ${r.description}\n   语言: ${r.language}\n   总结: ${r.readmeSummary || "无"}`
    )
    .join("\n\n");

  return `用户需求：${userInput}

找到的相似项目：
${reposText}

请按上述 JSON 结构输出完整的二次开发提示词。devPrompt 字段使用以下 Markdown 模板：

# AI 开发任务

## 用户目标
[一句话]

## 推荐基础项目
[owner/repo + URL]

## 为什么选择该项目
- 原因1
- 原因2

## 需要保留的能力
- ...
## 需要新增的能力
- ...
## 需要避免的问题
- ...

## 开发步骤
### 第1步：阅读原项目
先阅读 README、package.json 和目录结构
### 第2步：...
...

## 检查标准
- ...
`;
}

// ─── 代码可改造性判断 Prompt ───

export const ASSESS_MODIFIABILITY_SYSTEM = `你是一个代码架构分析助手。

请根据项目信息简要判断该项目的代码可改造性：

判断维度：
1. 技术栈是否常见易改（React/Next.js/Vue/Python 等）
2. 是否过度复杂（单体巨项目、微服务过度拆分等）
3. 前后端耦合是否严重
4. 是否适合本地部署
5. 是否依赖大量第三方服务
6. 是否适合交给 AI 编程工具二次开发

请输出严格的 JSON 格式。`;

export function buildAssessModifiabilityPrompt(projectInfo: string): string {
  return `请根据以下项目信息判断代码可改造性：

${projectInfo}

请输出 JSON:
{
  "modifiabilityScore": 0-100,
  "assessment": "简短中文评估，50 字以内"
}`;
}
