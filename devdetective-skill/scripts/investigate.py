"""
DevDetective 侦查工具 — 主入口

用法:
    py -3.12 scripts/investigate.py "我想做一个局域网文件快传网页"
    py -3.12 scripts/investigate.py "做一个本地知识库" --format json --output-dir ./reports

依赖: requests (pip install requests)
前提: DevDetective 服务已在 http://localhost:4567 运行
"""

import sys
import json
import os
import argparse
from datetime import datetime

# 添加脚本目录到 path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils import api_call, ensure_dir, save_file
from generate_report import format_markdown_report

BASE_URL = os.environ.get("DEVDETECTIVE_URL", "http://localhost:4567")


def investigate(idea: str, output_format: str = "markdown", output_dir: str = "reports") -> dict:
    """调用 DevDetective API 执行完整侦查流程"""
    print(f"[INFO] 正在侦查: {idea[:60]}...")
    print(f"   API: {BASE_URL}/api/investigate")

    payload = {
        "idea": idea,
        "maxResults": 10,
        "outputFormat": output_format,
    }

    result = api_call(f"{BASE_URL}/api/investigate", payload)

    if "error" in result:
        print(f"[ERROR] 侦查失败: {result['error']}")
        sys.exit(1)

    print("[OK] 侦查完成")
    print(f"   找到 {len(result.get('repos', []))} 个相似项目")
    print(f"   Top 3: {[r['repo']['full_name'] for r in result.get('topRecommendations', [])]}")

    # 无论终端输出 JSON 还是 Markdown，都额外落一份 .md 报告，方便后续交给 Agent 或人工复查。
    markdown = format_markdown_report(idea, result)
    ensure_dir(output_dir)
    safe_name = idea.replace(" ", "-")[:30]
    filename = f"devdetective-{safe_name}-{datetime.now().strftime('%Y-%m-%d')}.md"
    filepath = os.path.join(output_dir, filename)
    save_file(filepath, markdown)
    print(f"[REPORT] 报告已保存: {filepath}")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="DevDetective — AI 编程前置侦查工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  py -3.12 scripts/investigate.py "我想做一个局域网文件快传网页"
  py -3.12 scripts/investigate.py "做一个本地知识库" --format json
  py -3.12 scripts/investigate.py "微信小程序 UI 模板" --output-dir ./my-reports
        """,
    )
    parser.add_argument("idea", nargs="?", help="开发想法描述")
    parser.add_argument("--format", choices=["json", "markdown"], default="markdown", help="输出格式")
    parser.add_argument("--output-dir", default="reports", help="报告输出目录")
    parser.add_argument("--server", default=None, help="DevDetective 服务地址 (默认 http://localhost:4567)")

    args = parser.parse_args()

    if args.server:
        global BASE_URL
        BASE_URL = args.server

    if not args.idea:
        # 交互模式
        print("DevDetective — 写代码前，先查 GitHub 有没有成熟轮子")
        print()
        args.idea = input("请输入你的开发想法: ").strip()
        if not args.idea:
            print("[ERROR] 请输入有效的开发想法")
            sys.exit(1)

    result = investigate(args.idea, args.format, args.output_dir)

    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
