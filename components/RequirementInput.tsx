"use client";

import { useState } from "react";

interface Props {
  onSearch: (input: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  "我想做一个网页工具，在同一个 WiFi 下，不同设备可以快速互传文件，不需要登录",
  "我想做一个本地工具，用来把微信视频号内容转成文字，按日期和主题归档",
  "我想做一个本地运行的提示词与素材管理工具，支持导入 md/txt/json 文件",
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card p-6">
        <textarea
          className="w-full h-32 bg-transparent border border-[#2d3343] rounded-lg p-4 text-[#e4e7ee] placeholder-[#5c6378] resize-none focus:outline-none focus:border-primary-500 transition-colors text-base"
          placeholder="描述你想开发的小工具，例如：我想做一个局域网文件快传网页，支持同 WiFi 下不同设备快速分享文件。"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#5c6378]">
            {value.length < 10
              ? `至少输入 10 个字（当前 ${value.length}）`
              : `已输入 ${value.length} 字`}
          </span>
          <button
            onClick={handleSubmit}
            disabled={isLoading || value.trim().length < 10}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-[#2d3343] disabled:text-[#5c6378] text-white rounded-lg font-medium transition-all text-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                侦查中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                开始侦查
              </>
            )}
          </button>
        </div>
      </div>

      {/* 快速示例 */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {EXAMPLES.map((example, i) => (
          <button
            key={i}
            onClick={() => setValue(example)}
            disabled={isLoading}
            className="text-xs text-[#8b92a5] hover:text-[#e4e7ee] bg-[#21252f] hover:bg-[#2d3343] px-3 py-1.5 rounded-full transition-colors border border-[#2d3343]"
          >
            试试：{example.slice(0, 20)}...
          </button>
        ))}
      </div>
    </div>
  );
}
