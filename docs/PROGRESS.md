# Quizora implementation record

This records the original Quizora implementation and its local verification. The portfolio is now deployed through GitHub Pages, and the current navigation groups tools under `/lab/`.

## Unsupervised Lab update, 12 October 2026

- Replaced the Fun and Quizora top navigation entries with Unsupervised Lab. `/fun/` redirects to `/lab/`; its arcade source and assets were removed.
- Featured Quizora, the QR Code Generator, and a PromptPilot v2 preview, with space for a future project.
- Brought preset content and custom color controls from `qr-code-generator` into the published `/exam/qr/` tool.
- `npm run check`, `npm test`, `npm run build`, inventory verification, and targeted Lab/QR browser tests passed. The current inventory contains 27 content routes and redirects, 8 exam routes, and 77 assets.

## Implementation checklist

- [x] Astro static portfolio adapter, URL and asset inventory, and manual deployment configuration.
- [x] Shared strict schemas, deterministic grading, D1 migrations and manual publication.
- [x] Participant capabilities, server timing, conditional saves and final submission, recovery.
- [x] Management, manual grades, independent release, exports, deletion and retention.
- [x] Browser extraction and optional outbound local AI service.
- [x] Practice and competition, six locale dictionaries, RTL, responsive interface and accessibility checks.
- [x] Unit, real local D1 integration, browser, source security review and measured local load checks; documentation.
- [x] Pilot refinement: calm sage/cream light theme and dark companion, browser-only QR tool, participant QR sharing and download, AI hidden by default.

## Verification on 12 October 2026

- `npm run check`: passed, 36 Astro files with no diagnostics plus Worker TypeScript.
- `npm test`: 19 passed, including real Miniflare Worker/D1 requests, state transitions, grading, authorization, concurrency and expiry.
- `npm run build`: passed, 37 static routes, including `/exam/qr/`.
- `npm run inventory` and `node scripts/verify-build.mjs`: 27 content routes and redirects, 8 exam routes and 78 unchanged assets verified.
- `npm run ai:schema`: passed. `local-ai/.venv/bin/python -m pytest -q local-ai`: 3 passed.
- `npm run db:migrate`: 16 local D1 commands applied successfully.
- `npm run test:e2e`: 5 passed in Chrome against local Astro and Wrangler at the original launch, including the former arcade. The current browser tests cover the Lab instead.
- `npm run load`: all five local Miniflare/D1 runs passed at 25, 50, 100, 250 and 500 participants. At 500, 4,503 measured requests had zero errors and p95 latency of 2,510.87 ms. Detailed environment, row counts and limitations are in [load-results.json](load-results.json).

## Launch gates

The actual Ollama model is not installed in this environment, so generation with a real model remains unverified and AI is disabled in the pilot. Staging/production Cloudflare resources, secrets, Turnstile, hosted CPU and quota measurements, native-language review, and GitHub Pages configuration need account-specific setup and review before public launch. Local concurrency results do not establish production capacity. See [go-live steps](GO-LIVE.md), [operations](OPERATIONS.md), [costs](COSTS.md) and [security review](SECURITY-REVIEW.md).
