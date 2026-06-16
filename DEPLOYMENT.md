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

### 推荐部署方式

优先顺序建议：

1. Vercel 先跑体验版
2. Docker / Node 自托管用于后续并入 AI2Work 主站环境

仓库已包含：

- `vercel.json`
- `Dockerfile`

### 建议配置

```ini
HOSTED_EXPERIENCE_MODE=true
HOSTED_DAILY_LIMIT=3
HOSTED_MAX_RESULTS=5
```

同时还需要在平台环境变量里配置：

```ini
DEEPSEEK_API_KEY=sk-xxx
GITHUB_TOKEN=ghp_xxx
DATABASE_URL=./data/devdetective.sqlite
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

### Vercel 部署步骤

1. 导入 `dadaleo/DevDetective`
2. 保持框架识别为 Next.js
3. 添加环境变量：
   - `DEEPSEEK_API_KEY`
   - `GITHUB_TOKEN`
   - `HOSTED_EXPERIENCE_MODE=true`
   - `HOSTED_DAILY_LIMIT=3`
   - `HOSTED_MAX_RESULTS=5`
4. 首次部署后请求 `/api/health` 检查配置状态

### Docker / Node 自托管步骤

构建镜像：

```bash
docker build -t devdetective:latest .
```

运行示例：

```bash
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sk-xxx \
  -e GITHUB_TOKEN=ghp_xxx \
  -e HOSTED_EXPERIENCE_MODE=true \
  -e HOSTED_DAILY_LIMIT=3 \
  -e HOSTED_MAX_RESULTS=5 \
  devdetective:latest
```

如果接入 AI2Work 主站反向代理，建议把：

- `ai2work.xyz/devdetective` 反代到该服务
- 或使用独立子域 `devdetective.ai2work.xyz`

## GitHub 开源发布前检查

- 确认 `.env.local` 未提交
- 确认 `data/*.sqlite` 未提交
- 确认 README 中仓库地址已替换为真实地址
- 确认 AI2Work 体验地址已替换为真实地址或标注待上线
- 确认 GitHub Release 文案已准备好
- 重新执行 `npm run lint` 和 `npm run build`

## 推荐后续动作

1. 补产品截图
2. 在 GitHub 创建 `v0.1.0` Release
3. 配置真实体验域名
4. 如果要正式上线，再补防刷和更稳定的限流存储
