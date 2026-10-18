# Third-party notices for OpenMath Studio

- [math.js](https://github.com/josdejong/mathjs), Apache-2.0; includes a CSparse port under LGPL-2.1+. Used for parsing, symbolic differentiation, and matrix operations.
- [MathLive](https://github.com/arnog/mathlive), MIT. Visual math field and virtual keyboard.
- [Plotly.js](https://github.com/plotly/plotly.js), MIT. Interactive 2D/3D chart rendering and export.
- [Tesseract.js](https://github.com/naptha/tesseract.js), Apache-2.0, and [English language data](https://github.com/naptha/tessdata), Apache-2.0 upstream with the npm package marked MIT. Ordinary printed text OCR. The locked `@tesseract.js-data/eng` package provides the `4.0.0_best_int` weight file; its repository explicitly permits a locally hosted copy. The build copies this file and Tesseract core into `/math/ocr/`.
- [PDF.js](https://github.com/mozilla/pdf.js), Apache-2.0. Existing repository dependency for PDF text extraction and rendering.
- [KaTeX](https://github.com/KaTeX/KaTeX), MIT. Existing repository dependency for equation preview.
- [Pyodide](https://github.com/pyodide/pyodide), MPL-2.0, and [SymPy](https://github.com/sympy/sympy), BSD-3-Clause. Downloaded on demand from a pinned jsDelivr path for advanced symbolic operations.

No mathematical OCR or handwriting model weights are bundled or distributed. Candidate model licenses are recorded in `OCR_BENCHMARK.md`; code and weights must be audited separately before adoption.
