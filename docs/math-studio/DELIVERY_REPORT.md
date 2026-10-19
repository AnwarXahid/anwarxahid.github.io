# OpenMath Studio — tested release boundary

This branch adds a real static `/math/` workspace and a Lab link. It does not change Quizora's Worker or D1 data. The first release is useful for local math solving, graphing, printed text extraction, visual editing, and notebook work. Equation photo OCR and pen-stroke recognition remain explicit product gaps.

| Capability | Status | Evidence or limit |
| --- | --- | --- |
| Standard notation solve, exact-style rational output, original-equation candidate checks | Limited, tested | Linear, quadratic, rational polynomial and one square-root subset; 34 unit tests across the repository |
| Deterministic teaching steps | Limited, tested | Linear, quadratic, 2×2 systems and divisible rational simplification; steps are checked numerically within the supported subset, not formal proof certificates |
| Optional advanced CAS | Limited, browser tested | Pinned Pyodide/SymPy factor, expand, simplify, real solve and integrate; no user Python execution; first use downloads runtime |
| 2D multiple curves and interactive 3D surfaces | Working for supported functions | Playwright renders Plotly chart and verifies a true `surface` trace; safe AST sampling, bounded grids, PNG export |
| Printed text OCR and PDF text extraction | Limited, browser tested | One synthetic PNG partial match; one text-native PDF fixture; no measured phone-photo accuracy |
| Formula image OCR / stroke recognition | Not implemented | No licensed model passed an actual browser fixture benchmark; manual correction path remains available |
| MathLive editor and shared expression | Working for tested input | Browser journey edits a visual field then solves its output; LaTeX/ASCII coverage is limited |
| IndexedDB notebook, JSON transfer and print | Working for tested cards | Browser reload and export tests; no images saved |
| Offline install, cache manager, 3×3 systems, formal derivations, inequalities, complex roots, statistics and units | Not implemented | No UI claim of support |

## Verification on the local machine

At the final checkpoint: `npm run check` passed with zero diagnostics; `npm test` passed **34/34** across five files; `npm run build` generated **39 static pages**, including `dist/math/index.html`; `npm run inventory` passed; `node scripts/verify-build.mjs` verified **27 content routes, eight exam routes and 79 unchanged assets**; `npm run test:e2e` passed **15/15 Chromium tests** in 1.2 minutes. The browser suite includes an ordinary OCR image, a text-native PDF, lazy SymPy, 2D/3D graphing, notebook reload, mobile solver, accessibility smoke and existing Quizora journeys. Firefox, Safari, low-end devices and a published Pages URL were not tested.

## Measured assets and performance

Built `/math/` HTML references 17,045 B app JS, 212,865 B shared React renderer JS, and three CSS files totaling 48,852 B before compression. This is a static file size, not a measured network transfer. Math computation worker is 675,066 B. Optional bundles include MathLive 800,818 B, KaTeX 259,000 B, PDF worker about 1.26 MB and Plotly 4.64 MB. Plotly, PDF and CAS load for their relevant views/actions. Locally hosted optional Tesseract assets occupy about **23 MB total** across compatibility variants; the English language file is 2,952,873 B compressed. The text OCR browser journey took **1.8 seconds** in the full suite. Optional Pyodide/SymPy browser journey took **14.6 seconds** in the full suite, after runtime cache warming; a cold runtime can be much slower. Peak memory was **not measured**. These times include UI actions and are not isolated inference benchmarks.

No formula OCR model is shipped, so formula OCR accuracy, latency and download size are **not measured**. See `OCR_BENCHMARK.md` for candidate licensing, sizes and the specific missing feasibility gate.

## Release and rollback

Run `npm ci`, `npm run dev`, then open `http://127.0.0.1:4321/math/`. No new secret or paid service is needed. Any push now runs `.github/workflows/ship.yml`, which tests, merges into `master` and deploys; `workflow_dispatch` on `master` remains available for a manual retry. Confirm `https://anwarxahid.github.io/math/` and the original routes after that workflow succeeds. Reverting the branch commit and pushing the revert to `master` rolls back the feature; browser-local notebooks are independent of repository rollback. See `OPERATIONS.md` and `THIRD_PARTY_NOTICES.md`.
