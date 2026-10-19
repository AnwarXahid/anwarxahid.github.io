# OCR feasibility and measured status

## Separate tasks

Ordinary printed text OCR uses [Tesseract.js](https://github.com/naptha/tesseract.js) in a worker. Its output is labeled **text OCR**, editable, and never presented as reliable formula LaTeX. PDF pages first use PDF.js text extraction; image-only pages can be rendered and passed to text OCR. The source file stays in the browser.

| Candidate | Task | License evidence | Distribution / size | Local Chrome inference | Decision |
| --- | --- | --- | --- | --- | --- |
| [ink-on / CoMER INT8](https://github.com/kimseungdae/ink-on) | Pen strokes, not uploaded photos | Repository code is Apache-2.0; independent model-weight provenance still needs an explicit audit | Project states ~7.2 MB model pair | Not run on fixture suite | Do not enable handwriting claim |
| [Nougat LaTeX ONNX](https://huggingface.co/onnx-community/nougat-latex-base-ONNX/tree/main/onnx) | Cropped equation image | Model and [source model](https://huggingface.co/Norm/nougat-latex-base) list Apache-2.0 | Quantized encoder ~79 MB plus decoder ~276 MB; excessive for default browser flow | Not downloaded or run | Do not ship as core OCR |
| [pix2tex](https://github.com/lukas-blecher/LaTeX-OCR) | Equation image | Code license visible in repository; released weights require separate review | PyTorch release does not supply a tested browser ONNX path here | Not run | Research only |

One ordinary printed-text fixture was generated in Chrome as a PNG reading `OPENMATH STUDIO`. Tesseract.js extracted at least `OPENMATH` from the uploaded pixels in the actual Scan UI; the test does not assert an exact full-line match. With the worker, WASM and language data hosted under `/math/ocr/`, the browser journey took **1.8 seconds** in the final full-suite run (2.6 seconds in a preceding isolated run) on the installed Chrome binary. This is **one partial-match synthetic ordinary-text fixture**, not a formula accuracy measurement or a phone-photo benchmark. The OCR language file is 2.9 MB compressed; one runtime variant loads about 6.6 MB of JS/WASM. All three compatibility variants total 23 MB in the built static site and are loaded only on OCR use.

No screenshot/photo or handwriting formula fixture accuracy, latency, peak memory, checksum, or cross-browser compatibility measurement exists yet. Consequently **image-to-LaTeX and stroke recognition are not implemented**. The app explicitly says so, leaves manual math entry available, and does not fabricate a confidence value. This is the exact gate: select a model with weight license and hosting permission, run real inference on the fixture suite in Chrome/Firefox/Safari, then record exact LaTeX, render equivalence, byte size, latency, memory, CORS, and hashes before enabling its control.

Fixture plan: printed linear equation, fraction, root, summation, matrix, integral, mixed paragraph/formula, tilted low-light phone photo, multiline page, and pen-stroke canvas. Ground-truth LaTeX should be stored with each fixture. Current measured image-formula accuracy: **not measured**. Current measured stroke accuracy: **not measured**. Ordinary text OCR currently has one partial-match browser fixture; word and character error rates are not measured.
