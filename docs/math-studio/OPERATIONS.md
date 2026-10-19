# Run, validate, and roll back

Use Node 22.12+ and `npm ci`, then `npm run dev` and open `http://127.0.0.1:4321/math/`. For a release check run:

```sh
npm run check
npm test
npm run build
npm run inventory
node scripts/verify-build.mjs
npm run test:e2e
```

Inspect `dist/math/index.html` and open the built site through `npm run preview` before deployment. This repo's `.github/workflows/pages.yml` deploys **only** on `workflow_dispatch` from `master`. The owner must review the diff, merge it, and start that manual workflow; no automated production action was added. After Pages finishes, check `https://anwarxahid.github.io/math/` plus `/lab/`, `/exam/`, `/exam/qr/`, resume, blog and publication routes. Test OCR resource downloads and PDF rendering under GitHub Pages.

Rollback is a normal code revert/redeploy of the commit containing `/math/` and the Lab link. No Cloudflare Worker, D1 schema, or portfolio content migration is involved. Existing browser notebooks remain local until users delete site data.
