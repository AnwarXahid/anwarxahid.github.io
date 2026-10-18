# Privacy and data flow

Math input, document bytes, graph samples, and notebook cards are processed in the browser. This feature does not call the Quizora Worker, analytics, accounts, or an application backend. Notebooks are stored in IndexedDB; the theme choice is stored in localStorage. The user can export a notebook and delete it with its visible Delete button. Browser/site data controls can also remove all local records.

Tesseract.js downloads its worker, WASM core, and English language data from this site's `/math/ocr/` path when first used. Optional advanced CAS downloads pinned Pyodide 0.28.3 and SymPy from `cdn.jsdelivr.net`. Those are **resource downloads**, not uploads of the user's document or equation. CAS downloads may expose normal request metadata such as IP address to that CDN. The ordinary OCR result, source image, and math input are not sent to any model host by application code. PDF.js, MathLive, math.js, KaTeX, and Plotly code is bundled into this site's static assets. The site has no service worker and makes no universal offline claim. The only other outgoing user action is clicking a GitHub feedback link.

Do not save sensitive source documents expecting a server deletion operation: the app does not upload them. OCR files remain in memory until the scan view is cleared or the page closes. Notebook import is text-only and renders text as text.
