"use client";

import { useState } from "react";

interface Props {
  coreFeatures: string[];
  searchQueries: string[];
  onRegenerate?: () => void;
  disabled?: boolean;
}

/** 将 searchQueries 分成两组：技术方向 / 扩展场景 */
function splitQueries(queries: string[]): { tech: string[]; scene: string[] } {
  if (queries.length <= 3) return { tech: queries, scene: [] };
  const mid = Math.ceil(queries.length / 2);
  return { tech: queries.slice(0, mid), scene: queries.slice(mid) };
}

export default function SearchKeywords({ coreFeatures, searchQueries, onRegenerate, disabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const hasContent = coreFeatures.length > 0 || searchQueries.length > 0;
  const { tech, scene } = splitQueries(searchQueries);

  if (!hasContent) return null;

  const allChips = [...coreFeatures, ...searchQueries];

  const handleCopy = () => {
    navigator.clipboard.writeText(allChips.join("\n"));
  };

  const startEdit = () => {
    setEditText(allChips.join("\n"));
    setEditing(true);
  };

  const Chip = ({ label }: { label: string }) => (
    <span className="inline-block bg-[#1a1d27]/80 border border-[#2d3343]/50 text-[#8b92a5] px-2.5 py-1 rounded-md text-xs font-mono hover:border-[#2d3343] hover:text-[#a5b4fc] transition-colors">
      {label}
    </span>
  );

  return (
    <div className="border border-[#2d3343]/50 rounded-lg bg-[#1a1d27]/50 px-5 py-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-[#8b92a5]">🔍 侦查线索</h3>
          <p className="text-xs text-[#5c6378] mt-0.5">
            系统已将你的需求拆解为以下 GitHub 搜索线索
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="text-[11px] text-[#5c6378] hover:text-[#8b92a5] transition-colors px-2 py-1 rounded hover:bg-[#21252f]"
            title="复制全部关键词"
          >
            复制
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={disabled}
              className="text-[11px] text-[#5c6378] hover:text-[#8b92a5] transition-colors px-2 py-1 rounded hover:bg-[#21252f] disabled:opacity-40"
            >
              重新生成
            </button>
          )}
          <button
            onClick={startEdit}
            className="text-[11px] text-[#5c6378] hover:text-[#8b92a5] transition-colors px-2 py-1 rounded hover:bg-[#21252f]"
          >
            手动编辑
          </button>
        </div>
      </div>

      {/* Edit mode */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="w-full h-24 bg-[#0f1117] border border-[#2d3343]/60 rounded-lg p-3 text-xs text-[#e4e7ee] placeholder-[#5c6378] resize-none focus:outline-none focus:border-primary-500/50 font-mono"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="每行一个关键词或搜索 query"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="text-[11px] text-[#5c6378] hover:text-[#8b92a5] px-2 py-1"
            >
              取消
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(editText);
                setEditing(false);
              }}
              className="text-[11px] bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 px-3 py-1 rounded transition-colors"
            >
              复制并关闭
            </button>
          </div>
        </div>
      ) : (
        /* View mode — 3 groups */
        <div className="space-y-3.5">
          {/* 核心功能线索 */}
          {coreFeatures.length > 0 && (
            <div>
              <span className="text-[11px] text-[#5c6378] uppercase tracking-wider mb-1.5 block">
                核心功能线索
              </span>
              <div className="flex flex-wrap gap-1.5">
                {coreFeatures.map((kw, i) => (
                  <Chip key={`core-${i}`} label={kw} />
                ))}
              </div>
            </div>
          )}

          {/* 技术方向线索 */}
          {tech.length > 0 && (
            <div>
              <span className="text-[11px] text-[#5c6378] uppercase tracking-wider mb-1.5 block">
                技术方向线索
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tech.map((kw, i) => (
                  <Chip key={`tech-${i}`} label={kw} />
                ))}
              </div>
            </div>
          )}

          {/* 扩展场景线索 */}
          {scene.length > 0 && (
            <div>
              <span className="text-[11px] text-[#5c6378] uppercase tracking-wider mb-1.5 block">
                扩展场景线索
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scene.map((kw, i) => (
                  <Chip key={`scene-${i}`} label={kw} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
