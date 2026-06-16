"use client";

import { useState } from "react";

interface Props {
  onSearch: (input: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  "我想做一个网页工具，在同一个 Wi-Fi 下，不同设备可以快速互传文件，不需要登录。",
  "我想做一个本地工具，用来把视频号内容转成文字，按日期和主题归档。",
  "我想做一个本地运行的提示词与素材管理工具，支持导入 md/txt/json 文件。",
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
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-[#3b455a] bg-[#171b25] p-5 shadow-[0_18px_40px_rgba(6,10,18,0.28)]">
        <textarea
          className="h-32 w-full resize-none rounded-xl border border-[#46516a] bg-[#0f131c] p-4 text-base text-[#e4e7ee] placeholder-[#6f7890] transition-colors focus:border-primary-500 focus:outline-none"
          placeholder="描述你想开发的小工具，例如：我想做一个局域网文件快传网页，支持同 Wi-Fi 下不同设备快速分享文件。"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#5c6378]">
            {value.length < 10 ? `至少输入 10 个字（当前 ${value.length}）` : `已输入 ${value.length} 字`}
          </span>
          <button
            onClick={handleSubmit}
            disabled={isLoading || value.trim().length < 10}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-500 disabled:bg-[#2d3343] disabled:text-[#5c6378]"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                侦查中...
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
                开始侦查
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((example, i) => (
          <button
            key={i}
            onClick={() => setValue(example)}
            disabled={isLoading}
            className="rounded-full border border-[#2d3343] bg-[#21252f] px-3 py-1.5 text-xs text-[#8b92a5] transition-colors hover:bg-[#2d3343] hover:text-[#e4e7ee]"
          >
            试试：{example.slice(0, 20)}...
          </button>
        ))}
      </div>
    </div>
  );
}
