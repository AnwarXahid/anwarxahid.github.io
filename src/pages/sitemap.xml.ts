import { records, isTranslatedPage, localizeUrl } from "../lib/portfolio";
import { localeCodes } from "../i18n/locales";
export async function GET() {
  const pages = (await records()).filter((p) => p.url != "/404.html");
  const urls = [
    ...pages.flatMap((p) =>
      isTranslatedPage(p)
        ? localeCodes.map((l) => localizeUrl(p.url, l))
        : [p.url],
    ),
    "/services/image-compress/",
    "/services/pdf-merge/",
    "/services/pdf-tools/",
    "/services/text-clean/",
    "/services/json-format/",
    "/services/text-compare/",
    "/services/file-converter/",
    "/services/qr-code/",
    "/services/background-remover/",
    "/services/ocr/",
    "/services/quick-pass/",
    "/exam/",
    "/exam/privacy/",
    "/math/",
    "/game/",
    "/game/save-my-bro/",
  ];
  return new Response(
    `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((p) => `<url><loc>https://anwarxahid.github.io${p}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
