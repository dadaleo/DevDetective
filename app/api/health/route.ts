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
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    github_token_configured: isGitHubConfigured(),
    ai_provider_configured: isDeepSeekConfigured(),
    nvidia_configured: isNvidiaConfigured(),
  });
}
