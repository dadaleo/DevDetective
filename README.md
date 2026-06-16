# DevDetective - Search GitHub before you build from scratch

> 写代码前，先查 GitHub 有没有成熟轮子。

DevDetective 是一个面向 AI 编程时代的开源侦查工具。你先输入应用想法，系统再去搜索 GitHub 上的相似项目，比较维护状态、License、活跃度和可复用性，最后给出一份可直接交给 Codex、Cursor、Claude Code 等工具的二次开发提示词。

## 它解决什么问题

很多开发需求其实已经有成熟开源实现，但大家常常直接让 AI 从零开始写，结果是：

- 消耗大量 token
- 做出半成品
- 忽略 License 和维护风险
- 错过可以直接 fork 或局部复用的现成方案

DevDetective 的目标就是把这一步前置。

## 适合谁使用

- 使用 Codex、Cursor、Claude Code 的开发者
- 需要快速做 MVP 的独立开发者和创业者
- 想先调研 GitHub 再决定是否重写的人
- 想把“开工前侦查”固化进 Agent 工作流的人

## 当前能力

- 输入中文或英文需求
- AI 拆解需求并生成 GitHub 搜索词
- 搜索相似仓库并做基础筛选
- 展示最近提交、最近更新、维护状态、Star、Fork、License
- 对候选项目做综合评分
- 生成 Top 3 推荐和 AI 开发提示词
- 导出 Markdown 侦查报告
- 提供统一的 `/api/investigate` 接口
- 提供可供 Agent 调用的 `devdetective-skill/`

## 在线体验

计划部署到：

- `ai2work.xyz/devdetective`
- 或 `devdetective.ai2work.xyz`

当前仓库以本地运行和开源发布为主，在线体验版仍在整理中。

## 托管体验版限制

为了控制托管成本，体验版建议默认开启轻量限制：

- 每天 3 次
- 默认返回 Top 5
- 适合快速验证需求，不替代本地开源完整版

这些限制可通过环境变量启用：

```ini
HOSTED_EXPERIENCE_MODE=true
HOSTED_DAILY_LIMIT=3
HOSTED_MAX_RESULTS=5
```

## 本地安装

```bash
git clone <your-repo-url>
cd gitdetectv
npm install
copy .env.example .env.local
```

然后编辑 `.env.local`：

```ini
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

GITHUB_TOKEN=ghp_your_github_token

NEXT_PUBLIC_APP_NAME=DevDetective
DATABASE_URL=./data/devdetective.sqlite
```

启动开发环境：

```bash
npm run dev
```

默认访问地址：

- [http://localhost:4567](http://localhost:4567)

## 环境变量说明

### 必填

- `DEEPSEEK_API_KEY`
- `GITHUB_TOKEN`

### 可选

- `DEEPSEEK_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `NVIDIA_API_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_NAME`

说明：

- `GITHUB_TOKEN` 用于提升 GitHub API 请求额度与稳定性
- 默认 AI Provider 走 DeepSeek
- `NVIDIA_API_KEY` 仅用于 README 批量总结分流，可不配置

## GitHub Token 获取

1. 打开 [GitHub token 页面](https://github.com/settings/tokens)
2. 创建 classic token
3. 勾选公开仓库读取所需权限
4. 将 token 填入 `.env.local`

## API 接口

### `POST /api/investigate`

统一侦查主接口，负责：

- 需求分析
- GitHub 搜索
- 项目评分
- Prompt 生成
- Markdown 报告生成

请求示例：

```json
{
  "idea": "我想做一个局域网文件快传网页",
  "techStack": ["Next.js"],
  "projectType": "Web 应用",
  "updatePreference": "最近 1 年有更新",
  "licensePreference": "MIT / Apache / BSD 等友好协议",
  "preferRecent": true,
  "maxResults": 10,
  "outputFormat": "markdown"
}
```

### `GET /api/health`

用于部署或体验版健康检查。

返回示例：

```json
{
  "status": "ok",
  "github_token_configured": true,
  "ai_provider_configured": true,
  "nvidia_configured": false
}
```

### `GET /api/examples`

返回内置案例。

## 使用示例

仓库内置 5 个典型场景：

- 局域网文件快传
- 视频号转文字归档
- 提示词素材管理器
- 微信小程序 UI 模板生成器
- GitHub 工具雷达

## Markdown 报告导出

侦查完成后可以直接导出 `.md` 报告，内容包括：

- 用户需求
- 需求理解
- 搜索关键词
- 相似项目列表
- Top 3 推荐
- License 风险提示
- AI 开发提示词

## Agent Skill

`devdetective-skill/` 提供一个适合 Codex / Cursor / Claude Code 的配套 Skill。

它的用途不是替代网页，而是让 Agent 在“开始写代码前”先调用 DevDetective 的侦查流程。

详见：

- [devdetective-skill/README.md](devdetective-skill/README.md)

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- sql.js
- GitHub REST API
- DeepSeek API

## 发布前待完成

当前仓库已经具备主流程，但在正式公开发布前，仍建议补齐：

- 实际产品截图
- 真实 GitHub 仓库地址
- AI2Work 体验版地址
- 更完整的部署说明

部署细节见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## License

MIT

详见 [LICENSE](LICENSE)。

## 免责声明

- 搜索和推荐结果仅供参考
- License 风险提示不构成法律建议
- 使用前请自行验证目标仓库的授权条款与项目质量
