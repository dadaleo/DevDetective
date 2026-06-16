/**
 * POST /api/generate-dev-prompt
 *
 * 根据用户需求和 Top 3 项目，使用 DeepSeek 生成可交给
 * Cursor / Claude Code / Copilot / Codex 等 AI 编程工具的二次开发提示词。
 */

import { NextRequest, NextResponse } from "next/server";
import { deepseekChatJSON, isDeepSeekConfigured } from "@/lib/ai/deepseek";
import {
  GENERATE_DEV_PROMPT_SYSTEM,
  buildGenerateDevPrompt,
} from "@/lib/ai/prompts";
import type { ScoredRepo } from "@/lib/types";

interface PromptInput {
  userInput: string;
  selectedRepos: ScoredRepo[];
}

export async function POST(request: NextRequest) {
  try {
    const body: PromptInput = await request.json();
    const { userInput, selectedRepos } = body;

    if (!userInput || !selectedRepos || !Array.isArray(selectedRepos)) {
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

    const prompt = buildGenerateDevPrompt(
      userInput,
      selectedRepos.map((sr) => ({
        fullName: sr.repo.full_name,
        url: sr.repo.html_url,
        description: sr.repo.description || "无描述",
        language: sr.repo.language || "未知",
        readmeSummary: sr.readmeSummary,
      }))
    );

    const result = await deepseekChatJSON<{
      summary: string;
      userGoal: string;
      baseProject: string;
      whyThisProject: string;
      keepCapabilities: string[];
      addCapabilities: string[];
      avoidIssues: string[];
      devSteps: string[];
      checkCriteria: string[];
      devPrompt: string;
    }>({
      systemPrompt: GENERATE_DEV_PROMPT_SYSTEM,
      userPrompt: prompt,
      temperature: 0.4,
      maxTokens: 4096,
    });

    return NextResponse.json({
      summary: result.summary || "",
      devPrompt: result.devPrompt || "",
      userGoal: result.userGoal,
      baseProject: result.baseProject,
      whyThisProject: result.whyThisProject,
      keepCapabilities: result.keepCapabilities || [],
      addCapabilities: result.addCapabilities || [],
      avoidIssues: result.avoidIssues || [],
      devSteps: result.devSteps || [],
      checkCriteria: result.checkCriteria || [],
    });
  } catch (err) {
    console.error("/api/generate-dev-prompt 错误:", err);
    const message = err instanceof Error ? err.message : "Prompt 生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
