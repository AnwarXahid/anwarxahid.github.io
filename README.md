# Anwar Zahid

My personal website: research, publications, experience, teaching, writing, and things I build.

**[Visit the portfolio](https://anwarxahid.github.io/)** · **[Explore the Lab](https://anwarxahid.github.io/lab/)**

## Unsupervised Lab

The Lab is a collection of small, focused tools and original browser games. Each service has its own page and processes your input on your device, without uploading it to a server or requiring an account.

### Services

| Tool | What it does |
| --- | --- |
| [PDF Tools](https://anwarxahid.github.io/services/pdf-tools/) | Merge, split, extract page ranges, or compress PDF documents directly in the browser. |
| [Image Compressor & Resizer](https://anwarxahid.github.io/services/image-compress/) | Compress JPG, PNG, or WebP images, resize to exact pixel dimensions, and download. |
| [File Format Converter](https://anwarxahid.github.io/services/file-converter/) | Convert images between WebP, PNG, and JPG, or extract audio tracks to 16-bit PCM WAV. |
| [Text Compare](https://anwarxahid.github.io/services/text-compare/) | Compare texts with line-level and word-level diffs, expose whitespace, and download. |
| [Text Clean & Scratchpad](https://anwarxahid.github.io/services/text-clean/) | Trim lines, clean whitespace, convert letter case, compute text metrics, and format data. |
| [QR Code Generator](https://anwarxahid.github.io/exam/qr/) | Generate custom QR codes for text, Wi-Fi networks, and vCards with PNG and SVG export. |
| [Background Remover](https://anwarxahid.github.io/services/background-remover/) | Remove solid or uniform backgrounds with tolerance and feathering, exporting transparent PNGs. |
| [OCR / Image to Text](https://anwarxahid.github.io/services/ocr/) | Extract selectable text from uploaded images or pasted clipboard screenshots locally. |
| [JSON Format](https://anwarxahid.github.io/services/json-format/) | Validate, format, or minify JSON while preserving arbitrary large number precision. |

All browser services process data entirely on your device without transmitting files to external servers. File and input limits are clearly disclosed on each tool's page.

> **Note on Large-File Drop**: Cross-device temporary file transfers require shared object storage. Because static GitHub Pages cannot store files and Cloudflare R2 is currently disabled on the account, this tool is intentionally omitted from the live directory to prevent deceptive mock links. See [Large-File Drop Architecture](docs/LARGE_FILE_DROP_ARCHITECTURE.md) for technical details and the deployment roadmap.

### Games

- **[Carry My Bro](https://anwarxahid.github.io/game/)** — collect your crew, switch lanes, and dodge obstacles.
- **[Save My Bro](https://anwarxahid.github.io/game/save-my-bro/)** — rescue falling friends across three skydiving rounds.

### Others

- **[Quick Pass](https://anwarxahid.github.io/services/quick-pass/)** — end-to-end encrypted ephemeral text transfer between devices. Protected with client-side AES-256-GCM encryption, auto-expiring in 10 minutes with optional burn-after-reading.
- **[PromptDude](https://anwarxahid.github.io/PromptDude/)** — a browser extension for choosing the depth, tone, and format of prompts on supported AI chat sites. Its source lives in the [PromptDude repository](https://github.com/AnwarXahid/PromptDude).

The Lab also has **Projects**, **Papers**, and **Apps** sections. These are intentionally empty until there is work to add. The portfolio's research and publication sections remain separate from these Lab categories.

## Development

The website uses **Astro, React, and TypeScript**, builds to static files, and is hosted on GitHub Pages. Portfolio content comes from the repository's Markdown, HTML, YAML, and Liquid templates. Interactive services and games run in the browser.

Use a current **Node.js 22.x** release and npm, then:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4321/` for the portfolio or `/lab/` for the tools. The portfolio, browser services, and games do not need a database or API server.

### Checks

```sh
npm run check
npm test
npm run build
npm run inventory
node scripts/verify-build.mjs
npx playwright install chromium
npm run test:e2e
```

The browser suite also starts a local Worker for the older quiz application's regression tests. Its test configuration supplies the local API settings.

### Repository map

| Location | Contents |
| --- | --- |
| `_pages/`, `_posts/`, `_publications/`, `_data/` | Portfolio content and structured data |
| `_layouts/`, `_includes/`, `_i18n/` | Portfolio templates and translations |
| `src/pages/services/` | Individual service routes |
| `src/components/services/` | Browser tool interfaces and processing logic |
| `src/layouts/ServiceLayout.astro` | Shared tool page layout and theme controls |
| `src/pages/game/`, `public/game/` | Game pages and assets |
| `assets/` | Shared styles and scripts |
| `tests/` | Unit, API, and browser tests |
| `.github/workflows/ship.yml` | Test, build, and GitHub Pages deployment pipeline |

## Deployment

Pushes are handled by the repository's existing **Test and deploy** workflow:

| Branch | Behavior |
| --- | --- |
| `master` | Run checks, build, verify, and deploy to GitHub Pages. |
| Other branches | Run checks, merge passing changes into `master`, and trigger deployment. |
| `wip/*` | Run checks only, without automatic merging or deployment. Use this for changes awaiting review. |

A failed check stops publication. Workflow file changes need to be merged or pushed directly to `master`, because the built-in Actions token cannot push workflow edits. Cloudflare services are deployed separately from the static website.

## Languages

The portfolio and Lab directory support English, Chinese, Hindi, Spanish, Arabic, French, Bengali, Portuguese, Russian, and Urdu. Arabic and Urdu use right-to-left layouts. Translation files live in `_i18n/`; tests check for missing and unused translation keys. The standalone services and games currently use English interfaces.

## Older applications

The repository also retains **Quizora** at `/exam/` and **OpenMath Studio** at `/math/`. They are not featured in the current Lab directory. The QR generator retains its existing `/exam/qr/` address.

Quizora's optional backend uses a Cloudflare Worker and D1. To work on it locally, copy `.env.example` to `.env`, run `npm run db:migrate`, and start `npm run worker:dev` alongside the site. Its optional AI integration is disabled by default. Backend details and older implementation notes are in [operations](docs/OPERATIONS.md) and [architecture](docs/ARCHITECTURE.md).

## License

See [LICENSE](LICENSE).
