"use client";

import { useState } from "react";

interface Props {
  onSearch: (input: string) => void;
  isLoading: boolean;
}

const EXAMPLE_CARDS = [
  {
    title: "局域网文件快传",
    description: "同 Wi-Fi 下快速传文件",
    input:
      "我想做一个局域网文件快传工具，在同一个 Wi-Fi 下让手机和电脑之间快速传输文件，不需要注册登录，支持拖拽上传和下载历史。",
  },
  {
    title: "视频号转文字归档",
    description: "转写内容，按日期和主题保存",
    input:
      "我想做一个视频号内容归档工具，把视频或直播内容转成文字，自动按日期、主题和关键词整理，方便后续检索和写作复用。",
  },
  {
    title: "提示词素材管理器",
    description: "导入 md/txt/json，管理角色设定和提示词",
    input:
      "我想做一个本地运行的提示词素材管理器，可以导入 md、txt、json 文件，整理角色设定、写作提示词和常用模板，支持搜索和标签。",
  },
];

export default function RequirementInput({ onSearch, isLoading }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed.length < 10) return;
    onSearch(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-[28px] border border-[#324056] bg-[linear-gradient(180deg,rgba(20,26,37,0.96),rgba(14,18,26,0.94))] p-5 shadow-[0_20px_70px_rgba(4,10,20,0.24)] sm:p-6">
      <div className="mb-5 flex flex-col gap-2">
        <div className="inline-flex w-fit items-center rounded-full border border-[#33415a] bg-[#121926] px-3 py-1 text-[11px] font-medium text-[#9fb0c8]">
          Online Investigation Console
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#edf2ff] sm:text-2xl">开始一次开发前侦查</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#97a4ba]">
            描述你想开发的小工具，系统会先帮你搜索 GitHub 上的相似项目。
          </p>
        </div>
      </div>

      <div className="rounded-[22px] border border-[#2e3a4f] bg-[#0d131d]/90 p-3 sm:p-4">
        <textarea
          className="h-32 w-full resize-none rounded-[18px] border border-[#3b4b66] bg-[#111925] px-4 py-4 text-base text-[#eef3ff] placeholder-[#6f7d95] outline-none transition-colors focus:border-[#55c1b3]"
          placeholder="例如：我想做一个局域网文件快传网页，支持同 Wi-Fi 下不同设备快速分享文件，并有简单的历史记录。"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6f7d95]">
            <span>{value.length < 10 ? `至少输入 10 个字，当前 ${value.length}` : `已输入 ${value.length} 个字`}</span>
            <span className="hidden text-[#556278] sm:inline">按 Enter 可直接开始</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || value.trim().length < 10}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#3d7cff,#2ec5b6)] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(47,124,255,0.22)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#2b3445] disabled:text-[#6d788a] disabled:shadow-none sm:px-6"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                正在侦查...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                开始侦查 GitHub
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#62728c]">Quick Examples</p>
          <p className="text-xs text-[#556278]">点击后自动填入输入框</p>
        </div>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {EXAMPLE_CARDS.map((example) => (
            <button
              key={example.title}
              type="button"
              onClick={() => setValue(example.input)}
              disabled={isLoading}
              className="min-w-[230px] rounded-[18px] border border-[#2d394d] bg-[#121926]/92 p-4 text-left transition-all hover:border-[#45688f] hover:bg-[#172233] md:min-w-0"
            >
              <div className="text-sm font-semibold text-[#edf2ff]">{example.title}</div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#8f9bb0]">{example.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
