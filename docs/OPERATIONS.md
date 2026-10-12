# Setup and operation

No resources have been provisioned and no deployment has been performed. Use separate development, staging and production databases/secrets. Never add `.env`, `.dev.vars`, learner data or D1 exports to Git.

## Local frontend and real Worker/D1

Use Node 22.12+ and npm 9.6.5+ as required by Astro (local verification used Node 22.22.1 and npm 9.2.0, which emitted an engine warning). Dependencies are locked by `package-lock.json`; `npm ci` is the repeatable installation command.

```sh
npm ci
cp .env.example .env
npm run db:migrate
npm run worker:dev
# In a second terminal:
npm run dev
```

Open `http://127.0.0.1:4321/` or `/exam/`. Keep both processes running. Local D1 persists under `worker/.wrangler/`; it is not production D1. Start with the labeled science sample or manually add questions, customize the title/settings, review, then publish. Save the private management recovery record. Open the participant link in a separate browser context to test isolation. Private links use fragments, are cleared after bootstrap and enter authorization headers only.

The pilot hides AI controls and keeps `AI_ENABLED=false`. `/exam/qr/` generates QR images locally in the browser; the publish screen generates a QR for the participant link only. See [GO-LIVE.md](GO-LIVE.md) for the short account setup and publishing sequence.

```sh
npm run check
npm test
npm run build
npm run ai:schema
npx playwright install chromium
npm run test:e2e
npm run load
```

Browser tests launch the actual local Worker with migrated local D1. Unit/integration tests create isolated in-memory Miniflare D1 databases, with actual SQL and Worker requests. Load tests also use this real local runtime, not homepage requests or a fake API. They are accelerated and do not establish cloud capacity. See `docs/load-results.json` for measured outcomes once generated.

## Worker/D1 staging and production (only when authorized)

1. Create a Cloudflare account and choose Workers Free. Authenticate Wrangler locally with `npx wrangler login`.
2. Create a staging D1 database using `npx wrangler d1 create quizora-staging`. Record its returned identifier in a separate staging Wrangler configuration copied from `worker/wrangler.toml`. Set the binding to `DB`, the correct migration directory and Worker entry path. Never reuse the development dummy ID.
3. Set `ENVIRONMENT="staging"` or `"production"`, exact `ALLOWED_ORIGINS` (for example `https://anwarxahid.github.io`), creation cap, attempt cap and AI switch. Configure a Turnstile widget for that hostname and action `create`. Set its private secret via `wrangler secret put TURNSTILE_SECRET --config <config>` and the public site key at frontend build time. Production creation fails closed if verification is absent. Set a random `ADMIN_SECRET` as well; it salts rotating abuse digests and guards the usage endpoint.
4. Provision each 256-bit key with `python3 -c 'import secrets; print(secrets.token_hex(32))'` on a trusted terminal. Set `AGENT_SECRET` and, only for people allowed to generate questions, `AI_CREATOR_SECRET` using Wrangler secrets. Never put agent/admin keys into the browser. Rotate both Worker and PC configuration when revoking an agent. A creator quiz key can be rotated from its management page, invalidating the previous link.
5. Apply `wrangler d1 migrations apply <database-name> --remote --config <config>` and deploy with `wrangler deploy --config <config>` only after reviewing the target account/database. Begin with the workers.dev HTTPS URL; no purchased domain is necessary.
6. Smoke-test a private staging quiz, then set frontend `PUBLIC_API_BASE=https://<worker>.workers.dev/v1`. No other secret belongs in `PUBLIC_*` variables.

The repository deliberately contains no automated Worker deploy job. Production binding values require account-specific input. Use Wrangler rollback for code after reviewing schema compatibility. D1 migrations are append-only: back up before applying a new migration; rollback data through a reviewed forward fix or D1 Time Travel restoration to a separate recovery database where possible. Never assume restoring a database and rolling back Worker code are the same operation. Restrict access to backup exports and remove them according to retention policy.

## GitHub Pages

The verified repository is a user site, so `site` is `https://anwarxahid.github.io` and `base` is `/`. In repository Settings → Pages choose **GitHub Actions** only when adopting the migration. The Pages workflow includes the public API URL and Turnstile site key as defaults; repository variables can override them. The Pages workflow is manual and permits only `master`; it never publishes a feature branch. Review/merge the feature branch, run verification, then explicitly dispatch deployment. Existing branch-based Jekyll publishing is not altered by local edits.

GitHub Pages has acceptable-use restrictions, including use as free hosting for commercial SaaS and primarily transactional commercial sites. Keep this initial portfolio feature noncommercial. Before commercial expansion, review current policy and move the Quizora frontend to an appropriate static host such as Cloudflare Pages if required; the portfolio can remain on GitHub Pages. Do not presume this documentation grants policy approval.

## Local AI

```sh
npm run ai:schema
cd local-ai
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Install Ollama separately, keep it on `127.0.0.1:11434`, and pull a model suitable for your available RAM/CPU/GPU. Set `OLLAMA_MODEL` to its exact installed tag (as returned by `/api/tags`). Set the HTTPS Worker URL and agent secret. Configure the matching Worker secret and set `AI_ENABLED=true`. To test locally, create `worker/.dev.vars` from its example with matching random keys and restart Wrangler.

```sh
# optional local HTTP diagnostics / generate / regenerate API
./run-api.sh
# outbound agent, one inference at a time; does not need the HTTP service
./run-agent.sh
```

The API and agent use the same inference service. Do not run independent generation clients alongside the agent if you need strict one-model-call capacity across processes. No public listener, Ollama exposure, tunnel, Queue, R2, Durable Object binding or paid model provider is needed. Idle polling is 60–70 seconds; connectivity backoff reaches 10 minutes. Leases last three minutes and renew every minute. Generation is bounded and one structural repair retry is allowed. Source excerpts must literally occur in supplied text. Validation proves shape, not truth or language correctness; the creator must review the output.

Hardware/model latency is not exam concurrency. Hundreds of participants use the stored quiz without doing inference. The UI uses actual agent heartbeat/model availability and marks stale heartbeats unavailable. Without an available local model, generation cannot be verified end to end: manual creation and exams remain fully independent. Never substitute invented AI questions for a failed model call.

## Imports

TXT and Markdown are read as text, never HTML. DOCX extraction uses Mammoth raw text. PDF text extraction is lazy-loaded and bounded to 50 pages; encrypted, unsupported or failed files report an error; a textless PDF reports that OCR is required. OCR is not included. Oversized extracted text is visibly truncated and remains editable before transmission.

`public/exam-import.csv` defines a single `question_json` column. Each quoted CSV cell holds one complete shared-schema question object. This deliberately precise import format supports all question types without interpreting arbitrary spreadsheet rows as assessments. JSON draft files can also be re-imported. All imported questions still require review and server validation before publication.

## Troubleshooting

- API unavailable: run the Worker, verify `/v1/health`, and set `PUBLIC_API_BASE` before the frontend build. GitHub Pages does not run API routes.
- CORS: frontend origin must exactly match the Worker allowlist, including scheme and local port. `localhost` and `127.0.0.1` are separate origins. No third-party cookie setting is required.
- AI offline: inspect model availability locally, exact model tag, configured secrets and the agent process; heartbeat older than three minutes is unavailable. Queueing does not promise a stopped PC will process work.
- Extraction fails: try plain text or the documented CSV template. Do not upload confidential originals to an undisclosed OCR service.
- Schedule rejected: use a valid IANA zone and an unambiguous wall time. DST folds and gaps are rejected. The server owns time; changing a participant clock has no effect.
- Save pending: stay in the tab and retry while the exam remains open. Recovery survives refresh in that tab. Answers received after the deadline are rejected, even if written offline before it.
- Revision conflict: another tab or delayed write may have used the same revision. Refresh/recover and inspect the acknowledged answers before continuing.
- Expired capability: expired/deleted records are denied even if physical cleanup has not run. Lost anonymous management secrets cannot be recovered by nickname or code.
- Quotas/busy: retry with backoff, pause new creation/AI, and inspect Cloudflare request/CPU and D1 row metrics. Preserve running exams by reducing new work. Do not raise quotas blindly or advertise unlimited use.
