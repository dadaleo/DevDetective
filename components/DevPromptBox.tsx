"use client";

interface Props {
  summary: string;
  prompt: string;
  onRegenerate?: () => void;
  disabled?: boolean;
}

export default function DevPromptBox({ summary, prompt, onRegenerate, disabled }: Props) {
  if (!prompt) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#8b92a5] uppercase tracking-wider">
          🚀 AI 二次开发提示词
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(prompt)}
            className="text-xs bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            一键复制 Prompt
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={disabled}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors px-3 py-1.5"
            >
              🔄 重新生成
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="bg-[#1a1d27] border border-[#2d3343] rounded-lg p-4 mb-4 text-sm text-[#8b92a5] leading-relaxed">
          {summary}
        </div>
      )}

      <pre className="bg-[#0f1117] border border-[#2d3343] rounded-lg p-4 text-sm text-[#e4e7ee] overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
        {prompt}
      </pre>
    </div>
  );
}
