/**
 * Markdown 报告生成器
 *
 * 按 §12 模板生成 DevDetective 侦查报告
 */

import type { ScoredRepo, InvestigationReport } from "./types";
import { getMaintenanceLabel, formatTimeAgo } from "./date-utils";

/**
 * 生成完整的 Markdown 侦查报告
 */
export function generateMarkdownReport(report: InvestigationReport): string {
  const { userInput, intentSummary, searchQueries, scoredRepos, aiConclusion, devPrompt, generatedAt } = report;

  const lines: string[] = [];

  // 标题
  lines.push(`# DevDetective 侦查报告`);
  lines.push(`> 生成时间：${generatedAt}`);
  lines.push("");

  // 1. 用户需求
  lines.push("## 1. 用户需求");
  lines.push("");
  lines.push(userInput);
  lines.push("");

  // 2. 需求理解
  lines.push("## 2. 需求理解");
  lines.push("");
  lines.push(intentSummary);
  lines.push("");

  // 3. 搜索关键词
  lines.push("## 3. 搜索关键词");
  lines.push("");
  for (const kw of searchQueries) {
    lines.push(`- \`${kw}\``);
  }
  lines.push("");

  // 4. 相似项目列表
  lines.push("## 4. 相似 GitHub 项目列表");
  lines.push("");
  lines.push("| 项目 | Star | Fork | License | 最近提交 | 维护状态 | 评分 | 建议 |");
  lines.push("| --- | ---: | ---: | --- | --- | --- | ---: | --- |");
  for (const sr of scoredRepos) {
    const r = sr.repo;
    const label = getMaintenanceLabel(r.pushed_at, r.updated_at, r.archived);
    lines.push(
      `| [${r.full_name}](${r.html_url}) | ${r.stargazers_count} | ${r.forks_count} | ${r.license?.spdx_id || "无"} | ${formatTimeAgo(r.pushed_at)} | ${label} | ${sr.totalScore} | ${sr.recommendation} |`
    );
  }
  lines.push("");

  // 5. Top 3 推荐
  if (scoredRepos.length > 0) {
    lines.push("## 5. Top 3 推荐");
    lines.push("");
    const top3 = scoredRepos.slice(0, 3);
    for (let i = 0; i < top3.length; i++) {
      const sr = top3[i];
      const r = sr.repo;
      const label = getMaintenanceLabel(r.pushed_at, r.updated_at, r.archived);
      lines.push(`### ${i + 1}. ${r.full_name}`);
      lines.push("");
      lines.push(`- **描述**: ${r.description || "无"}`);
      lines.push(`- **URL**: ${r.html_url}`);
      lines.push(`- **Star**: ${r.stargazers_count.toLocaleString()}  |  Fork: ${r.forks_count.toLocaleString()}`);
      lines.push(`- **语言**: ${r.language || "未知"}`);
      lines.push(`- **License**: ${r.license?.spdx_id || "未声明"}`);
      lines.push(`- **维护状态**: ${label}`);
      lines.push(`- **评分**: ${sr.totalScore}/100`);
      lines.push(`- **建议**: ${sr.recommendation}`);
      lines.push(`- **AI 分析**: ${sr.aiReason}`);
      lines.push("");
    }
  }

  // 6. 不建议使用的项目
  const notRecommended = scoredRepos.filter((sr) => sr.recommendation === "不建议使用" || sr.maintenanceLabel === "已归档");
  if (notRecommended.length > 0) {
    lines.push("## 6. 不建议使用的项目");
    lines.push("");
    for (const sr of notRecommended) {
      lines.push(`- **${sr.repo.full_name}**: ${sr.aiReason || "维护状态差或功能不匹配"}`);
    }
    lines.push("");
  }

  // 7. 最终判断
  lines.push("## 7. 最终判断");
  lines.push("");
  lines.push(aiConclusion);
  lines.push("");

  // 8. AI 开发提示词
  lines.push("## 8. AI 开发提示词");
  lines.push("");
  lines.push(devPrompt);
  lines.push("");

  // 9. License 风险提示
  lines.push("## 9. License 风险提示");
  lines.push("");
  const riskyRepos = scoredRepos.filter(
    (sr) => !sr.repo.license || sr.repo.license.spdx_id === "noassertion"
  );
  if (riskyRepos.length > 0) {
    lines.push("> ⚠️ 以下项目未声明 License，商业化或二次分发前请自行确认授权风险：");
    lines.push("");
    for (const sr of riskyRepos) {
      lines.push(`- ${sr.repo.full_name}`);
    }
  } else {
    lines.push("所有推荐项目均声明了 License，但使用前仍建议自行确认授权条款。");
  }
  lines.push("");

  // 10. 下一步开发建议
  lines.push("## 10. 下一步开发建议");
  lines.push("");
  lines.push("1. 仔细阅读推荐项目的 README 和源码结构");
  lines.push("2. 本地 clone 并运行推荐项目，确认功能匹配度");
  lines.push("3. 根据 AI 开发提示词中的「需要保留/新增/避免」制定改造计划");
  lines.push("4. 将上述 AI 开发提示词交给 Cursor / Claude Code 开始二次开发");
  lines.push("5. 保留原项目的 License 声明，不要删除原作者信息");
  lines.push("");

  return lines.join("\n");
}

/**
 * 生成报告文件名
 */
export function generateReportFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = title
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "-")
    .slice(0, 40)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `devdetective-report-${safe}-${date}.md`;
}
