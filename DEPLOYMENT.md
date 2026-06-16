# Deployment Guide

## Targets

DevDetective currently supports two deployment modes:

1. Local open-source edition
2. AI2Work hosted experience edition

## 1. Local open-source edition

Recommended for GitHub users who want the full experience with their own API keys.

### Start locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

### Required environment variables

```ini
DEEPSEEK_API_KEY=sk-xxx
GITHUB_TOKEN=ghp_xxx
NEXT_PUBLIC_BASE_PATH=/DevDetective
DATABASE_URL=./data/devdetective.sqlite
```

### Verification

```bash
npm run lint
npm run build
```

## 2. AI2Work hosted experience edition

Recommended deployment targets:

- `ai2work.xyz/DevDetective`
- `devdetective.ai2work.xyz`

### Recommended deployment order

1. Run the hosted experience edition first
2. Then decide whether to connect it into the broader AI2Work main site flow

The repository already includes:

- `vercel.json`
- `Dockerfile`

### Hosted experience configuration

```ini
HOSTED_EXPERIENCE_MODE=true
HOSTED_LIMIT_WINDOW_HOURS=6
HOSTED_MAX_QUERIES_PER_WINDOW=2
HOSTED_MAX_RESULTS=5
NEXT_PUBLIC_BASE_PATH=/DevDetective
```

You also need:

```ini
DEEPSEEK_API_KEY=sk-xxx
GITHUB_TOKEN=ghp_xxx
DATABASE_URL=./data/devdetective.sqlite
```

### Hosted behavior

- return Top 5 repositories by default
- limit each IP to 2 investigations per 6 hours
- on the 2nd successful investigation, show a gentle GitHub Star prompt
- keep the unified `/api/investigate` endpoint

### Health check

Endpoint:

- `GET /api/health`

Returned fields:

- `status`
- `github_token_configured`
- `ai_provider_configured`
- `nvidia_configured`

### Vercel deployment

1. Import `dadaleo/DevDetective`
2. Keep framework detection as `Next.js`
3. Configure:
   - `DEEPSEEK_API_KEY`
   - `GITHUB_TOKEN`
   - `NEXT_PUBLIC_BASE_PATH=/DevDetective`
   - `HOSTED_EXPERIENCE_MODE=true`
   - `HOSTED_LIMIT_WINDOW_HOURS=6`
   - `HOSTED_MAX_QUERIES_PER_WINDOW=2`
   - `HOSTED_MAX_RESULTS=5`
4. After first deployment, request `/api/health` to confirm environment readiness

### Docker / Node self-host example

Build:

```bash
docker build -t devdetective:latest .
```

Run:

```bash
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sk-xxx \
  -e GITHUB_TOKEN=ghp_xxx \
  -e NEXT_PUBLIC_BASE_PATH=/DevDetective \
  -e HOSTED_EXPERIENCE_MODE=true \
  -e HOSTED_LIMIT_WINDOW_HOURS=6 \
  -e HOSTED_MAX_QUERIES_PER_WINDOW=2 \
  -e HOSTED_MAX_RESULTS=5 \
  devdetective:latest
```

If you later connect it behind the AI2Work reverse proxy, map:

- `ai2work.xyz/DevDetective`
- or `devdetective.ai2work.xyz`

## Before public GitHub release

- keep `.env.local` out of version control
- keep `data/*.sqlite` out of version control
- confirm the final AI2Work demo URL
- rerun `npm run lint` and `npm run build`

## Suggested next steps

1. Validate the hosted experience locally
2. Deploy the first online experience
3. Confirm the real domain and health check
4. Verify `devdetective-skill/` on a clean Python runtime
5. Then update GitHub screenshots, release notes, and public repo settings in one pass
