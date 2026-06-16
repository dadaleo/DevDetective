# DevDetective Skill

这个目录提供一个给 Codex、Cursor、Claude Code 等 Agent 使用的配套 Skill。

核心原则只有一条：

> 当用户要求开发新工具时，不要立刻从零写代码，先做 GitHub 侦查。

## 适用场景

- 新网页应用
- 本地桌面工具
- 浏览器插件
- 自动化脚本
- AI 工作流
- 适合先找开源底座再做二次开发的需求

## 目录结构

```text
devdetective-skill/
├── SKILL.md
├── README.md
├── requirements.txt
├── scripts/
│   ├── investigate.py
│   ├── github_search.py
│   ├── score_repos.py
│   ├── generate_report.py
│   └── utils.py
└── examples/
    ├── local-file-share.md
    ├── prompt-manager.md
    └── video-transcript-archive.md
```

## 安装

```bash
cd devdetective-skill
py -3.12 -m pip install -r requirements.txt
```

如果本机没有 `py -3.12`，使用任意可用的 Python 3.10+ 也可以，例如：

```bash
python -m pip install -r requirements.txt
```

## 使用前提

先启动 DevDetective Web 服务：

```bash
cd ..
npm install
npm run dev
```

默认服务地址：

- `http://localhost:4567`

运行前请确认：

- DevDetective Web 服务已经可访问
- Python 环境已安装 `requests`
- `.env.local` 中已经配置可用的 `DEEPSEEK_API_KEY` 和 `GITHUB_TOKEN`

## 使用方式

### 1. 直接调用 Python 脚本

```bash
py -3.12 scripts/investigate.py "我想做一个局域网文件快传网页"
```

### 2. 输出 JSON

```bash
py -3.12 scripts/investigate.py "做一个本地知识库管理工具" --format json
```

### 3. 指定报告目录

```bash
py -3.12 scripts/investigate.py "微信小程序 UI 模板生成器" --output-dir ./reports
```

### 4. 指定服务地址

```bash
py -3.12 scripts/investigate.py "GitHub 工具雷达" --server http://127.0.0.1:4567
```

## 输出内容

脚本会调用 `/api/investigate`，并返回：

- 需求理解
- 搜索关键词
- Top 项目列表
- 维护状态与推荐建议
- AI 开发提示词
- Markdown 报告

## 示例

示例输入与输出说明见：

- [examples/local-file-share.md](examples/local-file-share.md)
- [examples/prompt-manager.md](examples/prompt-manager.md)
- [examples/video-transcript-archive.md](examples/video-transcript-archive.md)

## 注意事项

- 这个 Skill 依赖本地运行中的 DevDetective 服务
- 如果没有配置 `GITHUB_TOKEN` 或 `DEEPSEEK_API_KEY`，主流程会失败
- 结果是“开发前侦查建议”，不是法律意见或自动决策
