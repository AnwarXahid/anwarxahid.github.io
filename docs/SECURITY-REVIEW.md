# Security review record

This is a source-level review and local test checklist, not a penetration-test certification. External production configuration is absent and public deployment is not authorized.

## Boundaries implemented

- Role-prefixed SHA-256 capability hashes. Creator/attempt/job secrets are independent 256-bit random values. Join codes are invitations, not authentication. Keys are in authorization headers, not URL queries.
- Management fragments consumed and removed; no external scripts/analytics on participant/management pages. Turnstile loads only on creator review when configured.
- Exact CORS origins, bounded request bodies, explicit Zod object schemas and prepared SQL.
- Public metadata has no questions or participants. Started-attempt payload uses a public allowlist. Released answer payload excludes private rubric and uploaded-source excerpts.
- No browser-side objective grading for private exams. Pending written marks are distinct from graded possible/total marks.
- Conditional state/revision/deadline writes, same-key submit retries, unique join idempotency and immutable versions.
- Drafts and pending answers are bounded and disclosed. Originals are parsed locally, with no automatic upload, HTML execution or document macros.
- React text escaping; bounded trusted-false KaTeX. Liquid/Markdown HTML rendering is isolated to trusted repository portfolio sources.
- Independent score/key release, creator-only export/delete/grade/rotation, spreadsheet-safe CSV, indexed bounded pages.
- No source-text, token or student-answer diagnostic logs. Expiry denial is independent of cron deletion. Backup limitations documented.
- QR images are generated locally. Published-quiz QR codes contain only public participant links, never management capability fragments. The generic QR tool does not send entered text to the server.

## Required deployment review

- Confirm Cloudflare account, actual Free CPU/row/request usage, database migrations and separation between staging/production.
- Set a random admin salt/key, creator AI key, agent secret, exact allowed origins and server-side Turnstile secret/hostname/action. Never deploy using `ENVIRONMENT=development` publicly.
- Verify hosted HTTPS URLs, complete CORS preflight behavior, private caching headers and management-link referrer behavior in the actual browsers/host.
- Free quotas are shared by all account applications. D1 abuse counters consume reads/writes. Authenticated dashboard/result reads and large leaderboards need production CPU profiling; local latency cannot prove a 10 ms CPU fit.
- Review minors' actual data use and school/parent requirements; no regulatory certification is asserted.
- Inspect screenshots, mobile/RTL keyboard flow and automated accessibility results. Native-language review is recommended for the six dictionaries before a broad public launch.
- `npm audit` currently reports five moderate dependency entries from one upstream `sprintf-js` denial-of-service advisory ([GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)) through `gray-matter` and `mammoth`. The former parses trusted repository content at build time; the latter parses bounded files in the user's browser. Recheck upstream fixes before broad launch.

## Deliberately deferred extras

Accounts, per-human identity/retake enforcement, team rounds, live per-question hosting, adaptive learning, automated essay scoring, OCR, speed bonuses, a PDF export engine and hosted AI providers are outside this initial implementation. Anonymous practice retakes create distinct attempts, bounded by the creator/administrator quiz attempt cap; a nickname is never a user identity.
