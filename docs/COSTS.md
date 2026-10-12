# Cost, limits and capacity

Official sources were opened and checked on 11 October 2026:

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): Free 100,000 requests/day, 10 ms CPU/request, 128 MB memory.
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): Free 5 million rows read/day, 100,000 rows written/day and 5 GB aggregate storage.
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/): Free 500 MB/database and seven-day Time Travel; single-threaded query processing per database.
- [D1 batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/): transactional batches; conditional SQL used instead of unsupported long-lived transactions.
- [Astro GitHub deployment](https://docs.astro.build/en/guides/deploy/github/).
- [GitHub Pages limits and acceptable use](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

These are account quotas, not numbers of people or simultaneous users. Targets can run for $0 in service charges while within Free quotas, plus the owner's hardware/electricity and internet costs. No mandatory paid AI provider or additional paid storage/service is configured. Recheck current policy and prices at launch. Free quota exhaustion can stop requests until reset; it is not infinite capacity.

## Transparent example

100 participants × 30 minutes × 4 changed-answer saves/minute = **12,000 autosave requests**. Unchanged answers send nothing. Add joining, start, recovery, status polling, result reads, retries, dashboard reads, agent polling and CORS preflight. Preflight caching reduces overhead but does not make it zero. Do not equate 100,000 requests with 100,000 participants.

The autosave path reads an indexed attempt/capability row, a small version answer-shape row, and conditionally updates one snapshot row while checking the indexed quiz. A normal save therefore has roughly 4–6 logical row reads and one table-row update (48,000–72,000 logical reads and 12,000 updates for that example). Actual D1 charged rows depend on query plans and index maintenance; report the returned D1 metadata rather than treating this estimate as billing. `status` is part of the deadline index; its updates may increase charged writes even where a status value is unchanged. Submission and retry/finalization operations add rows separately. Creation/join abuse buckets add writes as well.

The local load test records response latency, failed requests, D1 row metadata, correct scores and unique attempts at 25/50/100/250/500 participants. It synchronizes join/submit and jitters three accelerated changed-answer rounds. It is not a 30-minute soak or a production measurement. Local instrumentation currently excludes the initial publication batch metadata; this is disclosed in the JSON report. It does not measure Workers Free 10 ms CPU enforcement or account-wide quotas.

## Staging load tests: opt in only

Never run this against the production API. First obtain authorization for staging resource/quotas usage, configure a dedicated database and a restricted staging creation path (the default remote environment requires Turnstile), and make the endpoint explicit. The test does not silently bypass Turnstile. A staging operator can temporarily use development mode on an origin-restricted private staging instance, then restore it before exposing the endpoint.

```sh
ALLOW_STAGING_LOAD=I_HAVE_AUTHORIZATION STAGING_API=https://YOUR-STAGING-WORKER.workers.dev/v1 npm run load
```

Collect Cloudflare request/CPU metrics and D1 rows/storage alongside local output. Provisioning or running this consumes remote quotas and has not been authorized or performed. Confirm 100 participants produce correct final answers, no duplicates and acceptable errors/latencies before making a public capacity claim. Competition leaderboard computation and large creator exports should be profiled particularly carefully against Free CPU budgets.

## Upgrade path

First reduce polling, disable public AI, pause creation when busy, retain short data lifetimes, and bound class sizes. Profile indexes, query plans, CPU, dashboard pages and leaderboard aggregation. If measured load exceeds Free limits, obtain authorization before adopting a paid Workers plan, splitting workloads across D1 databases, or moving the frontend to a suitable host. Do not provision paid services automatically.
