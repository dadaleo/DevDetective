"""
项目评分脚本

根据硬指标对 GitHub 仓库进行基础评分（不含 AI 语义判断）。
完整评分请使用 investigate.py 调用 DevDetective API。

用法:
    py -3.12 scripts/score_repos.py repos.json
"""

import json
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def days_since(date_str: str) -> int:
    """距今多少天"""
    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    return (now - dt).days


def calc_activity_score(pushed_at: str | None, archived: bool) -> int:
    """活跃度评分 0-100"""
    if archived:
        return 0
    if not pushed_at:
        return 5
    days = days_since(pushed_at)
    if days <= 30:
        return 100
    if days <= 90:
        return 80
    if days <= 180:
        return 65
    if days <= 365:
        return 45
    if days <= 730:
        return 20
    return 5


def calc_maturity_score(stars: int, forks: int, created_at: str) -> int:
    """成熟度评分 0-100"""
    score = 0
    if stars >= 10000:
        score += 50
    elif stars >= 1000:
        score += 40
    elif stars >= 100:
        score += 25
    elif stars >= 10:
        score += 15
    else:
        score += 5

    if forks >= 1000:
        score += 25
    elif forks >= 100:
        score += 15
    elif forks >= 10:
        score += 10
    else:
        score += 5

    years = days_since(created_at) / 365
    if years >= 5:
        score += 25
    elif years >= 3:
        score += 20
    elif years >= 1:
        score += 15
    else:
        score += 10

    return min(100, score)


def calc_license_score(license_info: dict | None) -> int:
    """License 评分 0-100"""
    if not license_info:
        return 20
    spdx = (license_info.get("spdx_id") or "").lower()
    if spdx in ("mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause"):
        return 100
    if "gpl" in spdx:
        return 50
    return 70


def score_repos(repos: list[dict]) -> list[dict]:
    """给仓库列表打分"""
    for repo in repos:
        repo["activity_score"] = calc_activity_score(
            repo.get("pushed_at"), repo.get("archived", False)
        )
        repo["maturity_score"] = calc_maturity_score(
            repo.get("stargazers_count", 0),
            repo.get("forks_count", 0),
            repo.get("created_at", ""),
        )
        repo["license_score"] = calc_license_score(repo.get("license"))
        # 不含 AI 语义评分的简易总分
        repo["hard_score"] = round(
            repo["activity_score"] * 0.25
            + repo["maturity_score"] * 0.25
            + repo["license_score"] * 0.15
        )
    repos.sort(key=lambda r: r["hard_score"], reverse=True)
    return repos


def main():
    if len(sys.argv) < 2:
        print("用法: py -3.12 scripts/score_repos.py repos.json")
        sys.exit(1)

    with open(sys.argv[1], encoding="utf-8") as f:
        repos = json.load(f)

    scored = score_repos(repos)
    print(json.dumps(scored, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
