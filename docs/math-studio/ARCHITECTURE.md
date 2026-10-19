# Architecture

`src/pages/math/index.astro` emits a static route and hydrates a math-specific React app. The portfolio and Quizora do not import math components. `math/engine.ts` owns the bounded math.js AST allowlist and numeric sampling. `workers/math.worker.ts` runs calculations away from the UI; `math/workerClient.ts` restarts a timed-out worker. Graph, scan and MathLive editor components load only when selected. Plotly powers actual interactive 2D and 3D figures.

The editor's standard notation state is shared deliberately with Solve and Graph. Solve uses original-equation substitution to reject undefined and extraneous candidates. Graphs sample the same restricted grammar, inserting gaps for invalid values and detected large pole jumps. Steps are deterministic for the supported subset; they do not invoke an LLM.

The optional CAS worker converts the allowlisted math AST to a JSON tree, loads [Pyodide 0.28.3](https://pyodide.org/en/0.28.3/usage/index.html) and SymPy, and builds SymPy objects from fixed Python code. User text is never passed to Python `eval`, `exec`, or unrestricted `sympify`. A 60-second client timeout terminates the worker. The CDN domain is `cdn.jsdelivr.net`; this is a resource download, not a query upload.

Notebook records use version-1 IndexedDB object storage and remain on this origin. JSON imports pass shape and size validation. Images are not saved to notebooks. Print styles provide browser Print/Save PDF. There is no service worker in this release. Offline behavior depends on existing browser cache and is not guaranteed.

`scripts/math-assets.mjs` copies the Tesseract worker, three browser-compatible WASM variants, and English language data from locked npm packages into `/math/ocr/` during the existing asset preparation step. These 23 MB of optional OCR assets are generated for the static build and ignored in Git. They are requested only after the user runs text OCR.

Input limits: math expression 240 characters and 100 AST nodes; graph sample cap 1,000 points or 60×60 cells; worker timeout 8–12 seconds; image/PDF file 20 MB and PDF page selection capped at 50. These bounds limit ordinary use but are not a hardened security boundary against hostile browser extensions or compromised dependencies.
