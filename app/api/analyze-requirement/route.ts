/**
 * POST /api/analyze-requirement
 *
 * 使用 DeepSeek 对用户需求进行拆解，生成搜索关键词和搜索 query
 */

import { NextRequest, NextResponse } from "next/server";
import { deepseekChatJSON, isDeepSeekConfigured } from "@/lib/ai/deepseek";
import {
  ANALYZE_REQUIREMENT_SYSTEM,
  buildAnalyzeRequirementPrompt,
} from "@/lib/ai/prompts";
import { saveSearchSession } from "@/lib/cache";
import crypto from "crypto";

interface AnalyzeInput {
  userInput: string;
  filters?: {
    techStack?: string;
    projectType?: string;
    updatePreference?: string;
  };
  regenerate?: boolean;
}

interface AnalyzeOutput {
  intentSummary: string;
  coreFeatures: string[];
  keywordsCn: string[];
  keywordsEn: string[];
  searchQueries: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeInput = await request.json();
    const { userInput, filters, regenerate } = body;

    if (!userInput || userInput.trim().length < 10) {
      return NextResponse.json(
        { error: "请输入至少 10 个字的需求描述" },
        { status: 400 }
      );
    }

    if (!isDeepSeekConfigured()) {
      return NextResponse.json(
        { error: "DeepSeek API 未配置，请设置 DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }

    const prompt = buildAnalyzeRequirementPrompt(
      userInput.trim(),
      filters?.techStack,
      filters?.projectType,
      filters?.updatePreference
    );

    let result: AnalyzeOutput;
    try {
      result = await deepseekChatJSON<AnalyzeOutput>({
        systemPrompt: ANALYZE_REQUIREMENT_SYSTEM,
        userPrompt: prompt,
        temperature: regenerate ? 0.6 : 0.3, // 重新生成时提高创造性
        maxTokens: 2048,
      });
    } catch (err) {
      console.error("DeepSeek 需求分析失败:", err);
      return NextResponse.json(
        { error: "AI 需求分析失败，请稍后重试" },
        { status: 500 }
      );
    }

    // 保存 session
    const sessionId = crypto.randomUUID();
    try {
      await saveSearchSession(
        sessionId,
        userInput.trim(),
        JSON.stringify(filters || {}),
        JSON.stringify(result.searchQueries || [])
      );
    } catch (err) {
      console.warn("保存 session 失败:", err);
    }

    return NextResponse.json({
      intentSummary: result.intentSummary || "",
      coreFeatures: result.coreFeatures || [],
      keywordsCn: result.keywordsCn || [],
      keywordsEn: result.keywordsEn || [],
      searchQueries: result.searchQueries || [],
    });
  } catch (err) {
    console.error("/api/analyze-requirement 错误:", err);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
