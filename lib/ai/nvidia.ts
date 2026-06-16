/**
 * NVIDIA NIM API 客户端
 *
 * NVIDIA NIM 提供兼容 OpenAI SDK 的接口，用于分担 README 批量总结等轻量任务。
 * 模型: meta/llama-3.1-8b-instruct, mistralai/mixtral-8x7b-instruct-v0.1 等
 *
 * 注意: NVIDIA API 也兼容 OpenAI SDK，只需切换 baseURL。
 * Base URL: https://integrate.api.nvidia.com/v1
 */

import OpenAI from "openai";

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: NVIDIA_BASE_URL,
      apiKey: NVIDIA_API_KEY,
    });
  }
  return client;
}

export interface NvidiaChatParams {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** 默认使用 Llama 3.1 8B 轻量模型，速度快成本低 */
const DEFAULT_MODEL = "meta/llama-3.1-8b-instruct";

/**
 * 调用 NVIDIA NIM Chat API（用于 README 批量总结等轻量任务）
 */
export async function nvidiaChat(params: NvidiaChatParams): Promise<string> {
  const c = getClient();
  const model = params.model || DEFAULT_MODEL;

  const response = await c.chat.completions.create({
    model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    temperature: params.temperature ?? 0.2,
    max_tokens: params.maxTokens ?? 2048,
    stream: false,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("NVIDIA NIM 返回空内容");
  }

  return content;
}

/**
 * 批量并行调用 NVIDIA API 总结 README
 *
 * @param readmes - [{ id: string, text: string }]
 * @returns - [{ id: string, summary: string }]
 */
export async function nvidiaBatchSummarize(
  readmes: { id: string; text: string }[]
): Promise<{ id: string; summary: string }[]> {
  if (readmes.length === 0) return [];

  const SYSTEM_PROMPT =
    "你是一个开源项目分析助手。请用 2-3 句中文简洁总结以下 README 内容，重点说明项目功能、技术栈和适用场景。";

  const results = await Promise.all(
    readmes.map(async ({ id, text }) => {
      try {
        const summary = await nvidiaChat({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: text.slice(0, 6000), // 截断避免超 token 限制
          maxTokens: 300,
        });
        return { id, summary };
      } catch {
        // 单篇失败不影响整体
        return { id, summary: "无法总结" };
      }
    })
  );

  return results;
}

/**
 * 检查 NVIDIA API 是否已配置
 */
export function isNvidiaConfigured(): boolean {
  return !!NVIDIA_API_KEY;
}
