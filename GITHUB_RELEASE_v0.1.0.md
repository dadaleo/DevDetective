# v0.1.0 - Initial public-ready foundation

DevDetective is an open-source pre-build investigation tool for the AI coding era.

Before building from scratch, it helps you:

- search similar GitHub projects
- compare maintenance and license signals
- rank reuse candidates
- generate follow-up prompts for AI coding tools

## What is included

- unified `/api/investigate` workflow
- GitHub repository search and filtering
- reuse-oriented repo scoring
- AI-generated development prompts
- Markdown investigation report export
- `devdetective-skill/` for Codex / Cursor / Claude Code workflows
- hosted-demo preparation switches for future AI2Work deployment

## Why this release matters

This version establishes the first public-ready baseline of DevDetective:

- usable locally
- structured for open-source publishing
- ready for future hosted demo rollout

## Main capabilities

- Chinese and English idea input
- AI requirement analysis
- GitHub query generation
- maintenance and license signal display
- Top recommendations
- agent-friendly follow-up prompt generation

## Not included yet

These remain intentionally outside `v0.1.0`:

- GitHub OAuth
- paid SaaS flow
- private repo analysis
- one-click fork
- team workspace
- production-grade anti-abuse controls

## Local quick start

```bash
npm install
copy .env.example .env.local
npm run dev
```

Required environment variables:

- `DEEPSEEK_API_KEY`
- `GITHUB_TOKEN`

## Verification

Validated with:

- `npm run lint`
- `npm run build`
