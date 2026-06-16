# DevDetective v0.1.0

Initial public-ready foundation release for DevDetective.

## Summary

DevDetective v0.1.0 establishes the first usable open-source baseline:

- a unified investigation workflow
- GitHub repository search and scoring
- AI-generated follow-up prompts
- Markdown report export
- a bundled agent-oriented skill directory
- hosted-demo readiness switches for future AI2Work deployment

## Highlights

### Core investigation flow

- Natural-language idea input
- AI requirement analysis
- GitHub search query generation
- Similar repository search
- Reuse-oriented scoring and ranking
- AI-generated development prompt

### Repo evaluation signals

- stars
- forks
- last push time
- last update time
- maintenance status
- license signal
- heuristic documentation quality

### Output artifacts

- Top recommendations
- repo cards and comparison table
- Markdown investigation report
- reusable prompt for Codex, Cursor, Claude Code, and similar tools

### Agent skill support

The repository includes `devdetective-skill/` so the investigation workflow can be embedded into agent-first coding setups.

### Hosted demo preparation

This release also includes the first hosted-mode switches:

- `HOSTED_EXPERIENCE_MODE`
- `HOSTED_DAILY_LIMIT`
- `HOSTED_MAX_RESULTS`

These are intended for a future `ai2work.xyz` demo deployment.

## Included in v0.1.0

- Next.js web app
- unified `/api/investigate` endpoint
- `/api/health` and `/api/examples`
- Markdown export flow
- local SQLite-backed persistence via `sql.js`
- bilingual README baseline
- deployment guide

## Not included yet

These remain intentionally out of scope for `v0.1.0`:

- paid SaaS flow
- GitHub OAuth
- one-click fork
- private repository analysis
- production-grade anti-abuse controls
- polished public screenshots
- final hosted AI2Work deployment

## Recommended GitHub Release Title

`v0.1.0 - Initial public-ready foundation`

## Recommended GitHub Release Description

DevDetective is an open-source pre-build investigation tool for the AI coding era. Before building from scratch, it helps you search similar GitHub projects, compare maintenance and license signals, and generate follow-up prompts for AI coding tools.

## Upgrade / First Run Notes

```bash
npm install
copy .env.example .env.local
npm run dev
```

Required local configuration:

- `DEEPSEEK_API_KEY`
- `GITHUB_TOKEN`

## Verification

Verified in this iteration with:

- `npm run lint`
- `npm run build`
