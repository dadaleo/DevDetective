"""
GitHub 搜索脚本

直接调用 GitHub REST API 搜索仓库（可独立使用，也可被 investigate.py 调用）

用法:
    py -3.12 scripts/github_search.py "file sharing p2p web"
    py -3.12 scripts/github_search.py "local knowledge base" --limit 15 --token ghp_xxx
"""

import os
import sys
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import api_call

GITHUB_API = "https://api.github.com"


def search_github(
    query: str,
    limit: int = 10,
    token: str | None = None,
) -> list[dict]:
    """搜索 GitHub 仓库"""
    token = token or os.environ.get("GITHUB_TOKEN", "")
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DevDetective-Skill/0.2.0",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{GITHUB_API}/search/repositories?q={query}&sort=stars&order=desc&per_page={limit}"

    import requests
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    repos = []
    for item in data.get("items", []):
        repos.append({
            "name": item["name"],
            "full_name": item["full_name"],
            "html_url": item["html_url"],
            "description": item.get("description"),
            "language": item.get("language"),
            "stargazers_count": item["stargazers_count"],
            "forks_count": item["forks_count"],
            "open_issues_count": item["open_issues_count"],
            "license": item.get("license"),
            "created_at": item["created_at"],
            "updated_at": item["updated_at"],
            "pushed_at": item["pushed_at"],
            "archived": item.get("archived", False),
            "topics": item.get("topics", []),
            "homepage": item.get("homepage"),
        })

    return repos


def main():
    parser = argparse.ArgumentParser(description="GitHub 仓库搜索")
    parser.add_argument("query", help="搜索关键词")
    parser.add_argument("--limit", type=int, default=10, help="返回数量")
    parser.add_argument("--token", help="GitHub Token")
    args = parser.parse_args()

    repos = search_github(args.query, args.limit, args.token)
    print(json.dumps(repos, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
