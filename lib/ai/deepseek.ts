/**
 * DeepSeek API 客户端
 *
 * DeepSeek API 兼容 OpenAI SDK，只需切换 baseURL 和 apiKey。
 * 模型: deepseek-chat (通用), deepseek-reasoner (深度推理)
 */

import OpenAI from "openai";

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: DEEPSEEK_BASE_URL,
      apiKey: DEEPSEEK_API_KEY,
    });
  }
  return client;
}

export interface ChatParams {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
}

/**
 * 调用 DeepSeek Chat API
 */
export async function deepseekChat(params: ChatParams): Promise<string> {
  const c = getClient();
  const model = params.model || "deepseek-chat";

  const response = await c.chat.completions.create({
    model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    temperature: params.temperature ?? 0.3,
    max_tokens: params.maxTokens ?? 4096,
    response_format: params.responseFormat
      ? { type: params.responseFormat }
      : undefined,
    stream: false,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 返回空内容");
  }

  return content;
}

/**
 * 调用 DeepSeek Chat 并返回解析后的 JSON
 */
export async function deepseekChatJSON<T = unknown>(
  params: ChatParams
): Promise<T> {
  const text = await deepseekChat({
    ...params,
    responseFormat: "json_object",
  });
  return JSON.parse(text) as T;
}

/**
 * 检查 DeepSeek API 是否已配置
 */
export function isDeepSeekConfigured(): boolean {
  return !!DEEPSEEK_API_KEY;
}
