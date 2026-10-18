import { describe, expect, it } from "vitest";
import {
  safeParse,
  sample2D,
  sample3D,
  solve,
} from "../src/features/math-studio/math/engine";

describe("OpenMath bounded mathematics", () => {
  it("solves a linear equation with checked teaching steps", () => {
    const r = solve("2x+3=11", "Solve");
    expect(r.answer).toBe("x = 4");
    expect(r.steps).toHaveLength(2);
    expect(r.steps.every((s) => s.verified)).toBe(true);
  });
  it("solves a quadratic and checks both roots", () => {
    const r = solve("x^2-5x+6=0", "Solve");
    expect(r.answer).toBe("x = 2 or 3");
    expect(r.steps.every((s) => s.verified)).toBe(true);
  });
  it("retains cancelled denominator exclusions", () => {
    const r = solve("(x^2-1)/(x-1)", "Simplify");
    expect(r.answer).toContain("x + 1");
    expect(r.restrictions).toEqual(["(x - 1) ≠ 0"]);
    expect(r.steps[0].verified).toBe(true);
  });
  it("rejects an extraneous root after squaring", () => {
    const r = solve("sqrt(x+1)=x-1", "Solve");
    expect(r.answer).toBe("x = 3");
    expect(r.warning).toContain("extraneous");
  });
  it("checks a rational equation against its original denominator", () => {
    const r = solve("1/(x-2)=3", "Solve");
    expect(r.answer).toBe("x = 7/3");
    expect(r.restrictions[0]).toContain("≠ 0");
  });
  it("solves a linear 2x2 system", () =>
    expect(solve("2x+3y=7; x-y=1", "Solve").answer).toBe("x = 2, y = 1"));
  it("differentiates a product", () => {
    const answer = solve("x^3*sin(x)", "Differentiate").answer;
    expect(answer).toContain("cos(x)");
    expect(answer).toContain("sin(x)");
  });
  it("integrates a polynomial and computes a definite integral", () => {
    expect(solve("2x", "Integrate").answer).toContain("x^2 + C");
    expect(solve("x^2", "Definite integral", "x", 0, 1).answer).toBe("1/3");
  });
  it("computes determinant and rejects a singular inverse", () => {
    expect(solve("[[1,2],[3,4]]", "Determinant").answer).toBe("-2");
    expect(() => solve("[[1,2],[2,4]]", "Inverse")).toThrow("singular");
  });
  it("keeps rational arithmetic exact without turning rounded decimals into fractions", () => {
    expect(solve("1/3+1/6", "Evaluate").answer).toBe("1/2");
    expect(solve("0.333333", "Evaluate").answer).toBe("0.333333");
    expect(() => solve("1/0", "Evaluate")).toThrow("finite");
  });
  it("keeps identity domain exclusions and refuses unsupported equation families", () => {
    const identity = solve("x/x=1", "Solve");
    expect(identity.answer).toContain("All values");
    expect(identity.restrictions).toContain("x ≠ 0");
    for (const expression of ["abs(x)=2", "log(x)=1", "sin(x)=0"])
      expect(() => solve(expression, "Solve")).toThrow();
  });
  it("segments poles and invalid real domains", () => {
    expect(sample2D("1/x", -1, 1).some((p) => p[1] === null)).toBe(true);
    expect(
      sample2D("sqrt(x)", -1, 1)
        .filter((p) => p[0] < 0)
        .every((p) => p[1] === null),
    ).toBe(true);
    expect(
      sample2D("log(x)", -1, 1)
        .filter((p) => p[0] <= 0)
        .every((p) => p[1] === null),
    ).toBe(true);
  });
  it("samples a finite interactive 3D surface", () => {
    const data = sample3D("sin(x)*cos(y)", 5, 24);
    expect(data.z).toHaveLength(24);
    expect(data.z.flat().every((v) => v === null || Number.isFinite(v))).toBe(
      true,
    );
  });
  it("rejects code-like or malformed input", () => {
    expect(() => safeParse('import("x")')).toThrow();
    expect(() => solve("2x+=3", "Solve")).toThrow();
    expect(() => safeParse("x".repeat(241))).toThrow();
  });
});
