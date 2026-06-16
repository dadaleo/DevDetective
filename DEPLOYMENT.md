# Deployment Guide

## 目标

DevDetective 目前建议两种运行方式：

1. 本地开源版
2. AI2Work 托管体验版

## 1. 本地开源版

适合 GitHub 发布后的默认使用方式。

### 启动步骤

```bash
npm install
copy .env.example .env.local
npm run dev
```

### 必填环境变量

```ini
DEEPSEEK_API_KEY=sk-xxx
GITHUB_TOKEN=ghp_xxx
DATABASE_URL=./data/devdetective.sqlite
```

### 校验

```bash
npm run lint
npm run build
```

## 2. AI2Work 托管体验版

推荐部署地址：

- `ai2work.xyz/devdetective`
- `devdetective.ai2work.xyz`

### 建议配置

```ini
HOSTED_EXPERIENCE_MODE=true
HOSTED_DAILY_LIMIT=3
HOSTED_MAX_RESULTS=5
```

### 托管版行为

- 默认只返回 Top 5 仓库
- 默认限制每日 3 次体验
- 保留统一 `/api/investigate` 接口
- 首页展示案例库和体验版提示

### 健康检查

接口：

- `GET /api/health`

返回字段：

- `status`
- `github_token_configured`
- `ai_provider_configured`
- `nvidia_configured`

## GitHub 开源发布前检查

- 确认 `.env.local` 未提交
- 确认 `data/*.sqlite` 未提交
- 确认 README 中仓库地址已替换为真实地址
- 确认 AI2Work 体验地址已替换为真实地址或标注待上线
- 重新执行 `npm run lint` 和 `npm run build`

## 推荐后续动作

1. 初始化或接入真实 Git 仓库
2. 补产品截图
3. 配置真实体验域名
4. 如果要正式上线，再补防刷和更稳定的限流存储
