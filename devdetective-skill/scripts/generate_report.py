"""
报告生成脚本

将 DevDetective API 返回的结果格式化为 Markdown 报告。

用法:
    py -3.12 scripts/generate_report.py result.json --output report.md
"""

import sys
import os
import json
import argparse
from datetime import datetime


def format_markdown_report(idea: str, result: dict) -> str:
    """将 API 结果转为 Markdown 报告"""
    lines = []

    lines.append("# DevDetective 侦查报告")
    lines.append(f"> 生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append("")

    # 1. 用户需求
    lines.append("## 1. 用户需求")
    lines.append("")
    lines.append(idea)
    lines.append("")

    # 2. 需求理解
    intent = result.get("intentSummary", "")
    if intent:
        lines.append("## 2. 需求理解")
        lines.append("")
        lines.append(intent)
        lines.append("")

    # 3. 搜索关键词
    keywords = result.get("searchKeywords", [])
    if keywords:
        lines.append("## 3. 搜索关键词")
        lines.append("")
        for kw in keywords:
            lines.append(f"- `{kw}`")
        lines.append("")

    # 4. 相似项目
    repos = result.get("repos", [])
    if repos:
        lines.append("## 4. 相似 GitHub 项目")
        lines.append("")
        lines.append("| 项目 | Star | License | 评分 | 建议 |")
        lines.append("| --- | ---: | --- | ---: | --- |")
        for r in repos[:10]:
            repo = r.get("repo", r)
            lines.append(
                f"| [{repo['full_name']}]({repo['html_url']}) "
                f"| {repo.get('stargazers_count', 0)} "
                f"| {repo.get('license', {}).get('spdx_id', '无') if isinstance(repo.get('license'), dict) else '无'} "
                f"| {r.get('totalScore', r.get('hard_score', '-'))} "
                f"| {r.get('recommendation', '-')} |"
            )
        lines.append("")

    # 5. 开发提示词
    prompt = result.get("codexPrompt") or result.get("devPrompt", "")
    if prompt:
        lines.append("## 5. AI 开发提示词")
        lines.append("")
        lines.append(prompt)
        lines.append("")

    # 6. 免责声明
    lines.append("---")
    lines.append("")
    lines.append("*本报告由 DevDetective 自动生成，搜索结果仅供参考。使用开源项目前请自行验证 License 和代码质量。*")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="生成 DevDetective 报告")
    parser.add_argument("input", help="API 返回的 JSON 文件路径")
    parser.add_argument("--output", "-o", default="report.md", help="输出文件路径")
    parser.add_argument("--idea", help="原始需求描述")
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        result = json.load(f)

    idea = args.idea or result.get("userInput", "未知需求")
    markdown = format_markdown_report(idea, result)

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(markdown)

    print(f"📄 报告已生成: {args.output}")


if __name__ == "__main__":
    main()
