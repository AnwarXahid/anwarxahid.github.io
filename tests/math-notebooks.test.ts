import { expect, it } from "vitest";
import { validateNotebook } from "../src/features/math-studio/data/notebooks";
it("validates notebook imports and keeps card text as plain data", () => {
  const raw = {
    id: "a",
    name: "Test",
    cards: [
      {
        id: "b",
        kind: "text",
        content: "<script>alert(1)</script>",
        created: 1,
      },
    ],
    updated: 1,
  };
  expect(validateNotebook(raw).cards[0].content).toBe(raw.cards[0].content);
  expect(() =>
    validateNotebook({ ...raw, cards: [{ kind: "bad", content: "x" }] }),
  ).toThrow();
});
