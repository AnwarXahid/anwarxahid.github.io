import { it, expect } from "vitest";
import { compareTexts } from "../src/components/services/diff";
it("preserves line numbers through insertions and deletions", () => {
  expect(compareTexts("a\nb\nc", "a\nc\nd")).toEqual([
    { kind: "same", text: "a", oldLine: 1, newLine: 1 },
    { kind: "removed", text: "b", oldLine: 2 },
    { kind: "same", text: "c", oldLine: 3, newLine: 2 },
    { kind: "added", text: "d", newLine: 3 },
  ]);
});
it("handles empty input, CRLF and trailing newlines", () => {
  expect(compareTexts("", "")).toEqual([]);
  expect(compareTexts("", "x")[0].kind).toBe("added");
  expect(compareTexts("a\r\nb", "a\nb").every((l) => l.kind === "same")).toBe(
    true,
  );
  expect(compareTexts("a", "a\n").at(-1)).toMatchObject({
    kind: "added",
    text: "",
  });
});
it("applies explicit case and whitespace options", () => {
  expect(
    compareTexts(" A  B ", "a b", {
      ignoreCase: true,
      ignoreWhitespace: true,
    })[0].kind,
  ).toBe("same");
  expect(compareTexts("A", "a").map((l) => l.kind)).toEqual([
    "removed",
    "added",
  ]);
});
it("reconstructs each original from the diff including repeated lines", () => {
  for (let n = 0; n < 80; n++) {
    const a = Array.from({ length: n % 13 }, (_, i) =>
        String((i * n + 3) % 5),
      ).join("\n"),
      b = Array.from({ length: n % 17 }, (_, i) => String((i + n) % 7)).join(
        "\n",
      );
    const result = compareTexts(a, b);
    expect(
      result
        .filter((l) => l.kind !== "added")
        .map((l) => l.text)
        .join("\n"),
    ).toBe(a);
    expect(
      result
        .filter((l) => l.kind !== "removed")
        .map((l) => l.text)
        .join("\n"),
    ).toBe(b);
  }
});
it("rejects inputs exceeding the bounded comparison budget", () => {
  expect(() => compareTexts("a\n".repeat(1500), "b\n".repeat(1500))).toThrow(
    "fewer lines",
  );
});
it("bounds one-sided input too, avoiding a very large result rendering", () => {
  expect(() => compareTexts("a\n".repeat(1400), "")).toThrow("fewer lines");
  expect(() => compareTexts("", "a\n".repeat(1400))).toThrow("fewer lines");
});
