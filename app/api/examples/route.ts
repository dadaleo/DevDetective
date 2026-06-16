/**
 * GET /api/examples
 *
 * 返回内置案例库
 */

import { NextResponse } from "next/server";
import type { ExampleCase } from "@/lib/types";

const BUILTIN_EXAMPLES: ExampleCase[] = [
  {
    id: "local-file-share",
    title: "局域网文件快传",
    description: "同 WiFi 下不同设备快速互传文件",
    inputText:
      "我想做一个网页工具，在同一个 WiFi 下，不同设备可以快速互传文件，不需要登录，打开网页就能上传和下载。",
    tags: ["Web 应用", "文件传输", "P2P"],
  },
  {
    id: "video-transcript",
    title: "视频号转文字归档",
    description: "把微信视频号内容转成文字，按日期和主题归档",
    inputText:
      "我想做一个本地工具，用来把微信视频号内容转成文字，按日期和主题归档，方便学习太空知识。",
    tags: ["桌面应用", "视频处理", "知识管理"],
  },
  {
    id: "prompt-manager",
    title: "提示词素材管理器",
    description: "管理角色设定、提示词、项目素材，支持全文搜索",
    inputText:
      "我想做一个本地运行的工具，可以导入 md/txt/json 文件，用于管理角色设定、提示词、项目素材，并能全文搜索。",
    tags: ["桌面应用", "知识管理", "AI 工具"],
  },
  {
    id: "miniapp-ui-gen",
    title: "微信小程序 UI 模板生成器",
    description: "批量生成微信小程序 UI 模板和基础页面布局",
    inputText:
      "我想做一个工具，可以批量生成微信小程序 UI 模板，包括按钮、卡片、透明 PNG 小组件和基础页面布局。",
    tags: ["微信小程序", "UI 工具", "设计"],
  },
  {
    id: "github-radar",
    title: "GitHub 工具雷达",
    description: "定期发现 GitHub 上优秀 AI 小工具，自动分类评分",
    inputText:
      "我想做一个定期发现 GitHub 上优秀 AI 小工具的网站，自动分类、评分，并输出适合独立开发者参考的工具列表。",
    tags: ["Web 应用", "GitHub API", "AI 工具"],
  },
];

export async function GET() {
  return NextResponse.json({ examples: BUILTIN_EXAMPLES });
}
