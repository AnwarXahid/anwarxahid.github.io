import { it, expect } from "vitest";
import {
  formatWifiQr,
  formatVCardQr,
} from "../src/components/services/qr-tools";

it("escapes special characters in Wi-Fi QR strings correctly", () => {
  const result = formatWifiQr({
    ssid: "My;Special:Network\\Name",
    password: 'P@ss;word"123',
    authType: "WPA",
    hidden: true,
  });
  expect(result).toBe(
    'WIFI:T:WPA;S:My\\;Special\\:Network\\\\Name;P:P@ss\\;word\\"123;H:true;;',
  );

  const openResult = formatWifiQr({
    ssid: "GuestNetwork",
    authType: "nopass",
  });
  expect(openResult).toBe("WIFI:T:nopass;S:GuestNetwork;;");
});

it("formats RFC-compliant vCard 3.0 with escaped fields", () => {
  const card = formatVCardQr({
    firstName: "Anwar",
    lastName: "Zahid",
    organization: "Unsupervised Lab, Inc.",
    title: "Senior Researcher; Lead",
    phone: "+1 555-0100",
    email: "anwar@example.com",
    url: "https://anwarxahid.github.io",
  });
  expect(card).toContain("BEGIN:VCARD");
  expect(card).toContain("VERSION:3.0");
  expect(card).toContain("N:Zahid;Anwar;;;");
  expect(card).toContain("FN:Anwar Zahid");
  expect(card).toContain("ORG:Unsupervised Lab\\, Inc.");
  expect(card).toContain("TITLE:Senior Researcher\\; Lead");
  expect(card).toContain("TEL;TYPE=CELL:+1 555-0100");
  expect(card).toContain("EMAIL:anwar@example.com");
  expect(card).toContain("URL:https://anwarxahid.github.io");
  expect(card).toContain("END:VCARD");
});
