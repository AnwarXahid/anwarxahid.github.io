import { useRef, useState, useMemo } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Download, Copy, Check, ScanLine } from "lucide-react";
import { useI18n } from "../../i18n";
import { formatWifiQr, formatVCardQr, saveQrSvg } from "../services/qr-tools";

type Level = "L" | "M" | "Q" | "H";
const palettes = [
  { name: "qrSage", foreground: "#245b51", background: "#ffffff" },
  { name: "qrClassic", foreground: "#172b2b", background: "#ffffff" },
  { name: "qrOcean", foreground: "#214e68", background: "#f3f8fa" },
  { name: "qrClay", foreground: "#704d3d", background: "#fffaf3" },
] as const;

const presets = [
  { name: "qrWebsite", value: "https://example.com" },
  { name: "qrWifi", value: "WIFI:T:WPA;S:NetworkName;P:YourPassword;;" },
  { name: "qrEmail", value: "mailto:hello@example.com?subject=Hello" },
  { name: "qrPhone", value: "tel:+1234567890" },
] as const;

export function saveQr(canvas: HTMLCanvasElement | null, name: string) {
  if (!canvas) return false;
  try {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    return true;
  } catch {
    return false;
  }
}

export function QuizQr({ url, code }: { url: string; code: string }) {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState("");
  return (
    <div className="quiz-qr">
      <div className="qr-image">
        <QRCodeCanvas
          ref={canvas}
          value={url}
          size={224}
          level="H"
          marginSize={2}
          fgColor="#245b51"
          bgColor="#ffffff"
          role="img"
          aria-label={t("scanToJoin")}
        />
      </div>
      <div className="stack">
        <h3>{t("scanToJoin")}</h3>
        <p className="muted">{t("qrShareNote")}</p>
        <button
          className="secondary"
          type="button"
          onClick={() =>
            setMessage(
              saveQr(canvas.current, `quizora-${code.toLowerCase()}-qr.png`)
                ? "qrDownloaded"
                : "qrDownloadError",
            )
          }
        >
          <Download size={18} />
          {t("downloadQr")}
        </button>
        {message && (
          <p role="status" className="muted">
            {t(message)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function QrTool() {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [qrType, setQrType] = useState<"text" | "wifi" | "vcard">("text");
  const [value, setValue] = useState("");
  const [foreground, setForeground] = useState<string>(palettes[0].foreground);
  const [background, setBackground] = useState<string>(palettes[0].background);
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState<Level>("H");
  const [margin, setMargin] = useState(true);
  const [message, setMessage] = useState("");

  // Wi-Fi state
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiAuth, setWifiAuth] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // vCard state
  const [vcardFirst, setVcardFirst] = useState("");
  const [vcardLast, setVcardLast] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");
  const [vcardTitle, setVcardTitle] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardUrl, setVcardUrl] = useState("");

  const effectiveValue = useMemo(() => {
    if (qrType === "wifi") {
      if (!wifiSsid.trim()) return "";
      return formatWifiQr({
        ssid: wifiSsid.trim(),
        password: wifiPass,
        authType: wifiAuth,
        hidden: wifiHidden,
      });
    }
    if (qrType === "vcard") {
      if (!vcardFirst.trim() && !vcardLast.trim()) return "";
      return formatVCardQr({
        firstName: vcardFirst,
        lastName: vcardLast,
        organization: vcardOrg,
        title: vcardTitle,
        phone: vcardPhone,
        email: vcardEmail,
        url: vcardUrl,
      });
    }
    return value.trim();
  }, [
    qrType,
    value,
    wifiSsid,
    wifiPass,
    wifiAuth,
    wifiHidden,
    vcardFirst,
    vcardLast,
    vcardOrg,
    vcardTitle,
    vcardPhone,
    vcardEmail,
    vcardUrl,
  ]);

  const trimmed = effectiveValue;
  const canRender =
    !!trimmed && new TextEncoder().encode(trimmed).length <= 900;
  const selectedPalette = palettes.findIndex(
    (p) => p.foreground === foreground && p.background === background,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(trimmed);
      setMessage("qrCopied");
    } catch {
      setMessage("qrCopyError");
    }
  }

  function choosePalette(index: number) {
    setForeground(palettes[index].foreground);
    setBackground(palettes[index].background);
  }

  return (
    <div className="workspace qr-workspace">
      <div className="page-heading">
        <p className="eyebrow">
          <ScanLine size={18} />
          {t("qrTool")}
        </p>
        <h1>{t("qrHeading")}</h1>
        <p className="lede">{t("qrIntro")}</p>
      </div>

      <div
        className="tab-group"
        role="tablist"
        aria-label="QR Code Type"
        style={{ marginBottom: "1.25rem" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={qrType === "text"}
          className={qrType === "text" ? "tab active" : "tab"}
          onClick={() => {
            setMessage("");
            setQrType("text");
          }}
        >
          URL / Text
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={qrType === "wifi"}
          className={qrType === "wifi" ? "tab active" : "tab"}
          onClick={() => {
            setMessage("");
            setQrType("wifi");
          }}
        >
          Wi-Fi Network
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={qrType === "vcard"}
          className={qrType === "vcard" ? "tab active" : "tab"}
          onClick={() => {
            setMessage("");
            setQrType("vcard");
          }}
        >
          vCard Contact
        </button>
      </div>

      <div className="qr-layout">
        <section className="card stack">
          {qrType === "text" && (
            <>
              <label className="field">
                <span>{t("qrContent")}</span>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setMessage("");
                  }}
                  placeholder="https://example.com"
                />
              </label>
              <p className="muted">{value.length} / 1000</p>
              <div className="qr-presets">
                <span>{t("qrPresets")}</span>
                <div>
                  {presets.map((p) => (
                    <button
                      type="button"
                      className="secondary"
                      key={p.name}
                      onClick={() => {
                        setValue(p.value);
                        setMessage("");
                      }}
                    >
                      {t(p.name)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {qrType === "wifi" && (
            <div className="stack" style={{ gap: "0.75rem" }}>
              <label className="field">
                <span>Network Name (SSID) *</span>
                <input
                  type="text"
                  placeholder="e.g. Home_Network"
                  value={wifiSsid}
                  onChange={(e) => {
                    setWifiSsid(e.target.value);
                    setMessage("");
                  }}
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="text"
                  placeholder="Network password"
                  value={wifiPass}
                  onChange={(e) => {
                    setWifiPass(e.target.value);
                    setMessage("");
                  }}
                />
              </label>
              <div className="grid two">
                <label className="field">
                  <span>Encryption</span>
                  <select
                    value={wifiAuth}
                    onChange={(e) =>
                      setWifiAuth(e.target.value as typeof wifiAuth)
                    }
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                  </select>
                </label>
                <label className="check" style={{ marginTop: "1.5rem" }}>
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                  />
                  Hidden SSID
                </label>
              </div>
              <p
                className="muted"
                style={{ fontSize: "0.82rem", color: "#b45309" }}
              >
                ⚠️ Notice: Anyone who scans this Wi-Fi QR code will obtain the
                encoded network name and password.
              </p>
            </div>
          )}

          {qrType === "vcard" && (
            <div className="stack" style={{ gap: "0.75rem" }}>
              <div className="grid two">
                <label className="field">
                  <span>First Name *</span>
                  <input
                    type="text"
                    value={vcardFirst}
                    placeholder="e.g. Anwar"
                    onChange={(e) => {
                      setVcardFirst(e.target.value);
                      setMessage("");
                    }}
                  />
                </label>
                <label className="field">
                  <span>Last Name</span>
                  <input
                    type="text"
                    value={vcardLast}
                    placeholder="e.g. Zahid"
                    onChange={(e) => {
                      setVcardLast(e.target.value);
                      setMessage("");
                    }}
                  />
                </label>
              </div>
              <div className="grid two">
                <label className="field">
                  <span>Organization</span>
                  <input
                    type="text"
                    value={vcardOrg}
                    placeholder="Company or University"
                    onChange={(e) => setVcardOrg(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Job Title</span>
                  <input
                    type="text"
                    value={vcardTitle}
                    placeholder="Software Engineer"
                    onChange={(e) => setVcardTitle(e.target.value)}
                  />
                </label>
              </div>
              <div className="grid two">
                <label className="field">
                  <span>Phone Number</span>
                  <input
                    type="tel"
                    value={vcardPhone}
                    placeholder="+1 555-0199"
                    onChange={(e) => setVcardPhone(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={vcardEmail}
                    placeholder="name@example.com"
                    onChange={(e) => setVcardEmail(e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Website URL</span>
                <input
                  type="url"
                  value={vcardUrl}
                  placeholder="https://anwarxahid.github.io"
                  onChange={(e) => setVcardUrl(e.target.value)}
                />
              </label>
            </div>
          )}

          <fieldset className="stack">
            <legend>{t("qrColors")}</legend>
            <div className="qr-palettes">
              {palettes.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  className={`qr-palette ${i === selectedPalette ? "selected" : ""}`}
                  aria-pressed={i === selectedPalette}
                  onClick={() => choosePalette(i)}
                >
                  <span className="qr-swatches">
                    <span style={{ background: p.foreground }} />
                    <span style={{ background: p.background }} />
                  </span>
                  {t(p.name)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid two qr-color-controls">
            <label className="field">
              <span>{t("qrForeground")}</span>
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
              />
            </label>
            <label className="field">
              <span>{t("qrBackground")}</span>
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </label>
          </div>

          <div className="grid two">
            <label className="field">
              <span>
                {t("qrSize")} · {size}px
              </span>
              <input
                type="range"
                min="160"
                max="400"
                step="16"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span>{t("qrCorrection")}</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
              >
                <option value="L">L · 7%</option>
                <option value="M">M · 15%</option>
                <option value="Q">Q · 25%</option>
                <option value="H">H · 30%</option>
              </select>
            </label>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={margin}
              onChange={(e) => setMargin(e.target.checked)}
            />
            {t("qrMargin")}
          </label>
          <p className="muted">{t("qrLocal")}</p>
        </section>

        <section className="card qr-preview-panel">
          <h2>{t("qrPreview")}</h2>
          <div className="qr-preview-box">
            {canRender ? (
              <>
                <QRCodeCanvas
                  ref={canvas}
                  value={trimmed}
                  size={size}
                  level={level}
                  marginSize={margin ? 2 : 0}
                  fgColor={foreground}
                  bgColor={background}
                  style={{ maxWidth: "100%", height: "auto" }}
                  role="img"
                  aria-label={t("qrPreview")}
                />
                <div style={{ display: "none" }} aria-hidden="true">
                  <QRCodeSVG
                    ref={svgRef}
                    value={trimmed}
                    size={size}
                    level={level}
                    marginSize={margin ? 2 : 0}
                    fgColor={foreground}
                    bgColor={background}
                  />
                </div>
              </>
            ) : (
              <div className="qr-empty">
                <ScanLine size={46} />
                <p>{t(trimmed ? "qrTooLong" : "qrEmpty")}</p>
              </div>
            )}
          </div>
          <div
            className="qr-actions"
            style={{ flexWrap: "wrap", gap: "0.5rem" }}
          >
            <button
              type="button"
              disabled={!canRender}
              onClick={() =>
                setMessage(
                  saveQr(canvas.current, "qr-code.png")
                    ? "qrDownloaded"
                    : "qrDownloadError",
                )
              }
            >
              <Download size={18} />
              {t("downloadQr")}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={!canRender}
              onClick={() =>
                setMessage(
                  saveQrSvg(svgRef.current, "qr-code.svg")
                    ? "qrDownloaded"
                    : "qrDownloadError",
                )
              }
            >
              <Download size={18} />
              Download SVG
            </button>
            <button
              type="button"
              className="secondary"
              disabled={!trimmed}
              onClick={copy}
            >
              {message === "qrCopied" ? (
                <Check size={18} />
              ) : (
                <Copy size={18} />
              )}
              {t("qrCopy")}
            </button>
          </div>
          {message && (
            <p role="status" className="muted">
              {t(message)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
