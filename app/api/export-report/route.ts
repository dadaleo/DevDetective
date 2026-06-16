/**
 * POST /api/export-report
 *
 * 根据 session 数据生成并返回 Markdown 侦查报告
 */

import { NextRequest, NextResponse } from "next/server";
import { generateMarkdownReport, generateReportFilename } from "@/lib/report";
import type { InvestigationReport } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: {
      userInput: string;
      intentSummary: string;
      searchQueries: string[];
      scoredRepos: InvestigationReport["scoredRepos"];
      aiConclusion: string;
      devPrompt: string;
      title?: string;
    } = await request.json();

    if (!body.userInput || !body.scoredRepos) {
      return NextResponse.json(
        { error: "缺少必要字段 (userInput, scoredRepos)" },
        { status: 400 }
      );
    }

    const report: InvestigationReport = {
      title: body.title || "DevDetective 侦查报告",
      userInput: body.userInput,
      intentSummary: body.intentSummary || "",
      searchQueries: body.searchQueries || [],
      scoredRepos: body.scoredRepos,
      aiConclusion: body.aiConclusion || "",
      devPrompt: body.devPrompt || "",
      generatedAt: new Date().toISOString(),
    };

    const markdown = generateMarkdownReport(report);
    const filename = generateReportFilename(body.title || body.userInput.slice(0, 30));

    return NextResponse.json({ markdown, filename });
  } catch (err) {
    console.error("/api/export-report 错误:", err);
    return NextResponse.json(
      { error: "报告生成失败" },
      { status: 500 }
    );
  }
}
