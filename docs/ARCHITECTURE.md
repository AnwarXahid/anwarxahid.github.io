# Architecture and boundaries

Astro emits a user-site build at `/`, without a repository base prefix. The portfolio has no React hydration. The `src/lib/portfolio.ts` build adapter renders the existing front matter, Markdown, YAML records and Liquid layouts, preserving a single source of facts and the existing arcade scripts. This deliberate compatibility layer avoids transcription losses; it is not a Jekyll runtime. Quizora uses an independent layout and route-specific lazy React workflows.

The static frontend calls a Hono Worker at a configurable HTTPS URL using scoped opaque capabilities, not cookies. Published quiz snapshots and response snapshots are authoritative in D1. Only public shape fields are serialized to participants after start. Browser code never imports worker modules. The editor necessarily knows the creator's private draft answer keys; these are not published in site assets. Sample quizzes are explicitly public, local examples.

## Ownership

| Location | Data |
| --- | --- |
| Static host | Portfolio assets and application code; four public sample questions |
| Browser local storage | Creator draft, language, theme and presentation preference |
| Browser session storage | Creator capability, participant capability, join idempotency key, acknowledged revision and bounded pending answers |
| Worker/D1 | Published immutable quiz/version, SHA-256 role-separated capability hashes, UTC windows, attempts/answers/manual marks, release flags, expiring AI jobs and aggregate abuse counters |
| Owner PC | In-memory source text and inference output only; provisioned agent secret in ignored local configuration; Ollama model files |

The outbound Python agent leases one job at a time. It does not host any quiz or participant database. Shutting down the PC leaves existing exams operational. Manual creation does not call AI. Initial AI access requires a separately provisioned creator access key; anonymous AI is disabled by default. This single-owner deployment is not an account system.

The pilot build hides AI controls with `PUBLIC_ENABLE_AI=false`, and the Worker keeps `AI_ENABLED=false`. The QR tool at `/exam/qr/` renders and downloads images in the browser without sending their content to the API. Published quizzes render a QR code containing only the public participant link; management capability links are never encoded.

## State and atomicity

Quiz state derives from server time: published (host waiting), scheduled, open, closed, expired. Release flags are independent of closure. Published content/settings are immutable. Duplicating opens a new local draft; publication creates a new quiz/version and copies no attempts.

Attempt lifecycle: created → started → submitted or expired. Joining uses a client-generated random capability (256 bits) and a random idempotency key (128 bits), with a unique `(quiz_id, join_key)` constraint. The browser records these before making the request so a dropped response can be retried without adding a participant. Refresh does not join again.

Answer saves use a bounded JSON snapshot with compare-and-swap revision. Only changed answers travel over the network. Validation reads the small ID/type shape, without prompts or grading keys. Save SQL checks revision, active attempt, deadline, quiz expiry, end and explicit close in the mutation. Receipt time sampled by the Worker is authoritative. Final submission replaces the full validated snapshot and freezes the attempt in the same conditional statement. Same-key submissions are idempotent; stale saves cannot unfreeze them. A one-second server floor protects against excessive manual saves; normal client saves are staggered 15–18 seconds. Closed/deadline attempts lazily freeze their last durable answers when recovered/read, and scheduled cleanup also freezes expired deadlines.

The UI records pending answers before transmission, clears only values actually acknowledged, and never declares success from browser storage alone. A monotonic local timer follows a server sample; changing the wall clock cannot change server deadlines. Page unload is not a submission mechanism. Session storage does not survive every browser shutdown; recovery is scoped to the tab, intentionally avoiding indefinite shared-device credentials. Two tabs writing the same capability can conflict; the UI reports and resynchronizes instead of silently overwriting.

## Grading

Objective marks are computed on the Worker. Multiple-select defaults to exact sets. Partial credit subtracts wrong selections from correct selections, divides by the number of correct choices and clamps at zero. Matching and ordering optionally count correct positions/pairs. Blanks use canonical NFC normalization, optional explicit case folding and whitespace normalization; accents and mathematical symbols are never stripped. Written questions remain pending until a creator assigns marks. `gradedPossible` excludes pending questions, while `total` always includes them. No AI essay marks or client-clock speed bonuses. Competition ties share a place. Leaderboards require an attempt capability, opt-in settings, release and closure, and exclude pending attempts.

## Abuse and quotas

Creation/code/join entry points use atomic D1 time buckets, keyed by a rotating salted digest of the connecting IP; no raw IP is persisted. The generous shared-network cap (3,000/minute) avoids an IP-only per-student restriction. Global daily creation cap defaults to 100; each quiz admits at most 600 attempts. Save revisions and a per-attempt minimum interval avoid a separate rate-counter write per autosave. AI is gated by a provisioned key, 10 requests/key/day, 50/day globally, at most two queued jobs/key and ten globally, three leases/job and one live inference. CORS is an exact origin allowlist and is not authentication. Sensitive public creation requires server-verified Turnstile outside development.

The maximum 50 questions, 12 choices, 10 MB file, 50 PDF pages, 40,000 source characters and 64 KB answer snapshot are enforced in shared validation or parsing. Each long answer allows 8,000 characters, short answers 1,000. The aggregate answer-byte limit may be reached before every individual limit. Original files are not uploaded. No macros or imported HTML are executed. Optional math uses KaTeX without trust, with expansion and size bounds.

## Privacy and launch review

Quizzes expire within 90 days; responses are denied after their bounded expiry and retained at most 30 days after scheduled/explicit closure, capped by quiz lifetime. Untimed practice ends at explicit close or quiz expiry. AI queued, failed and completed records expire within one hour of creation; successful retrieval requires browser acknowledgement before immediate deletion. Scheduled cleanup is bounded and access denial is immediate even when deletion backlogs exist. A quiz deletion cascades to its version and attempts. D1 point-in-time recovery can retain deleted records for seven days on Free. Worker diagnostics log only event/class identifiers; provider operational metadata and retention must be reviewed in the actual account. This is not a promise of instant erasure from backups.

No account/email/real-name requirement, ads, third-party participant analytics, location, webcam or anti-cheating claim. Configure Turnstile only on creation. Schools and parents must review actual data flows and appropriate permissions before launch involving minors; minimization is not a COPPA/FERPA certification.

GitHub Pages cannot set arbitrary response security headers: the app uses a no-referrer meta policy and safe rendering. The Worker sets no-store, nosniff, no-referrer and restrictive API CSP. Do not treat an ignored `_headers` file as protection. Production CSP on the static host remains a hosting limitation; a host supporting headers can improve this.
