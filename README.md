# AIQualityHQ

Prompt quality analysis & optimization for LLM engineers. 38 deterministic rules across 7 dimensions, AI-powered enhancement, and a strict $0/month hosting budget.

## Quick Start

```bash
npm install
npm run dev       # local at localhost:4321
npm run build     # static output → dist/
```

## API

Analyze any prompt programmatically via the Cloudflare Pages Function at `/api/check`.

### Public usage

```bash
curl -X POST https://aiqualityhq.com/api/check \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Explain quantum computing simply."}'
```

Response:

```json
{
  "overallScore": 43,
  "passed": false,
  "dimensions": { "prompt": { "score": 42, "passed": false, "factorsCount": 10, "passedCount": 1 }, ... },
  "rules": [{ "id": "p-len", "name": "Prompt Length", "score": 60, "severity": "major", ... }],
  "recommendations": ["[MAJOR] Assign a persona.", ...],
  "metadata": { "charCount": 38, "wordCount": 5, "timestamp": ... }
}
```

### Authenticated usage (optional)

Set the `AIQuality_API_Key` environment variable in your Cloudflare Pages project, then pass it as a header:

```bash
curl -X POST https://aiqualityhq.com/api/check \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-secret-key' \
  -d '{"prompt":"Explain quantum computing simply."}'
```

### Rate limits

- **Public (no key):** rate-limited to 60 req/min per IP
- **With API key:** 1000 req/min

## GitHub Action

Gate your CI/CD on prompt quality by adding a step to any workflow.

### `.github/workflows/prompt-check.yml`

```yaml
on:
  pull_request:
    paths: ['prompts/**']
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/prompt-check
        with:
          prompt-file: prompts/my-prompt.txt
          score-threshold: '60'
          api-key: ${{ secrets.AIQUALITY_API_KEY }}
          comment-on-pr: 'true'
```

### Action inputs

| Input | Default | Description |
|---|---|---|
| `prompt` | — | Prompt text (inline) |
| `prompt-file` | — | Path to file containing prompt |
| `api-url` | `https://aiqualityhq.com/api/check` | API endpoint |
| `api-key` | — | API key (optional, public if omitted) |
| `score-threshold` | `60` | Minimum score to pass (0–100) |
| `comment-on-pr` | `false` | Post dimension breakdown as PR comment |

### Action outputs

| Output | Description |
|---|---|
| `score` | Overall score (0–100) |
| `passed` | `true` / `false` |
| `json` | Full analysis as stringified JSON |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloudflare Pages setup.

## Architecture

- **Static Astro site** (14 pages) hosted on Cloudflare Pages for $0/month
- **Analysis engine** (`functions/engine.ts`) — pure TypeScript, 38 regex-based rules, no external dependencies
- **API endpoint** (`functions/api/check.ts`) — Cloudflare Pages Function, optional API key auth
- **Local-first** — all scoring runs in-browser via debounce; no server calls for basic analysis
- **AI enhancement** — user-provided API keys (OpenAI, Anthropic, Gemini, DeepSeek, Llama)
- **38 rules** across 7 dimensions: Prompt Structure, Memory & State, Context Grounding, Trust & Accuracy, PII & Privacy, Security & Safety, Contradiction Detection
