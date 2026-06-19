/**
 * GET /api/health
 *
 * 服务健康检查，返回 API 配置状态
 */

import { NextResponse } from "next/server";
import { isDeepSeekConfigured } from "@/lib/ai/deepseek";
import { isGitHubConfigured } from "@/lib/github";
import { isNvidiaConfigured } from "@/lib/ai/nvidia";

export async function GET() {
  const hostedMode = process.env.HOSTED_EXPERIENCE_MODE === "true";
  const hostedWindowHours = Number(process.env.HOSTED_LIMIT_WINDOW_HOURS || "6");
  const hostedWindowLimit = Number(process.env.HOSTED_MAX_QUERIES_PER_WINDOW || "2");

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    github_token_configured: isGitHubConfigured(),
    ai_provider_configured: isDeepSeekConfigured(),
    nvidia_configured: isNvidiaConfigured(),
    experience_mode: hostedMode ? "hosted" : "local",
    experience_window_hours: hostedMode ? hostedWindowHours : null,
    experience_window_limit: hostedMode ? hostedWindowLimit : null,
  });
}
