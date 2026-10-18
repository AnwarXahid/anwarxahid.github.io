# OpenMath Studio implementation checkpoints

This document records the first release boundary. The route is isolated at `/math/`; existing portfolio and Quizora code remain in place.

1. **Preserve baseline:** clean `master` at start; original 19 unit tests passed. Astro static output and manual Pages workflow are retained.
2. **OCR feasibility:** compare distinct screenshot and stroke models before enabling equation recognition. Current result: neither passed a measured local Chromium fixture run, so both are explicitly unavailable in the interface. Ordinary printed text OCR uses Tesseract.js separately.
3. **Working slice:** bounded math.js AST, dedicated calculation worker with timeout, linear/quadratic/rational/square-root subset, verified candidates and limited teaching steps. Optional Pyodide/SymPy loads in a separate worker when a user chooses an advanced CAS operation.
4. **Graph slice:** 2D sampled curves and interactive Plotly 3D surfaces, lazy chart bundle, finite/domain checks, PNG/SVG export.
5. **Document slice:** image crop and ordinary OCR, selectable text extraction from PDF pages, editable result; 20 MB input and 50-page limit.
6. **Local work:** MathLive visual field, standard notation editor, IndexedDB notebook with JSON export/import and print-to-PDF.
7. **Remaining gates:** real formula OCR model benchmark, stroke model and canvas, broader CAS operations through the safe Pyodide adapter, more rigorous proof engine, offline asset caching and low-memory browser profiling. These are not release claims.

Acceptance for the implemented subset is `npm run check`, `npm test`, `npm run build`, `npm run inventory`, `node scripts/verify-build.mjs`, and the repository Playwright suite. See test results in the delivery report and `MATH_COVERAGE.md` for exact operations.
