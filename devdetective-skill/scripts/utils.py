"""
DevDetective Skill 工具函数
"""

import os
import json
import sys

import requests


def api_call(url: str, payload: dict, timeout: int = 120) -> dict:
    """调用 DevDetective API"""
    try:
        resp = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        print(f"❌ 无法连接 DevDetective 服务 ({url})")
        print("   请确保已启动: npm run dev")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print(f"❌ API 请求超时 ({timeout}s)")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"❌ API 错误: {e}")
        try:
            print(f"   {resp.json()}")
        except Exception:
            pass
        sys.exit(1)


def ensure_dir(path: str) -> None:
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)


def save_file(filepath: str, content: str) -> None:
    """保存文件"""
    ensure_dir(os.path.dirname(filepath) or ".")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
