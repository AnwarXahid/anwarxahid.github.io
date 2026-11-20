/**
 * Escaping and formatting helpers for QR code generators.
 * Conforms to standard Wi-Fi MeCard/WIFI format and vCard 3.0 specification.
 */

export function escapeWifi(str: string): string {
  return str.replace(/([\\;,:"])/g, "\\$1");
}

export type WifiOptions = {
  ssid: string;
  password?: string;
  authType: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
};

export function formatWifiQr(options: WifiOptions): string {
  const { ssid, password = "", authType, hidden = false } = options;
  const escapedSsid = escapeWifi(ssid);
  const escapedPass = escapeWifi(password);
  let result = `WIFI:T:${authType};S:${escapedSsid};`;
  if (authType !== "nopass" && password) {
    result += `P:${escapedPass};`;
  }
  if (hidden) {
    result += `H:true;`;
  }
  result += ";";
  return result;
}

export function escapeVCard(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export type VCardOptions = {
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
};

export function formatVCardQr(options: VCardOptions): string {
  const {
    firstName,
    lastName,
    organization = "",
    title = "",
    phone = "",
    email = "",
    url = "",
  } = options;

  const fn = [firstName, lastName].filter(Boolean).join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(fn)}`,
  ];

  if (organization) lines.push(`ORG:${escapeVCard(organization)}`);
  if (title) lines.push(`TITLE:${escapeVCard(title)}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone.trim()}`);
  if (email) lines.push(`EMAIL:${email.trim()}`);
  if (url) lines.push(`URL:${url.trim()}`);
  lines.push("END:VCARD");

  return lines.join("\n");
}

/**
 * Serialize an SVG element to an SVG blob and download it.
 */
export function saveQrSvg(
  svgElement: SVGSVGElement | null,
  filename: string,
): boolean {
  if (!svgElement) return false;
  try {
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
