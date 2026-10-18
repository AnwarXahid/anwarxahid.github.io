import { derivative, det, inv, parse, simplify, type MathNode } from "mathjs";

export type Step = {
  before: string;
  after: string;
  ruleId: string;
  explanation: string;
  verified: boolean;
  conditions?: string[];
};
export type SolveResult = {
  input: string;
  operation: string;
  answer: string;
  approximate?: string;
  verification: string;
  steps: Step[];
  restrictions: string[];
  warning?: string;
};
export type GraphPoint = [number, number | null];

const symbols = new Set(["x", "y", "t", "a", "b", "c", "pi", "e"]);
const functions = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sqrt",
  "log",
  "ln",
  "exp",
  "abs",
]);
const operators = new Set(["+", "-", "*", "/", "^"]);

export function safeParse(input: string): MathNode {
  if (!input.trim() || input.length > 240)
    throw new Error("Enter a math expression under 240 characters.");
  let count = 0;
  const root = parse(input.replace(/\bln\(/g, "log("));
  root.traverse((node) => {
    if (++count > 100) throw new Error("This expression is too complex.");
    if (node.type === "SymbolNode") {
      if (
        !symbols.has((node as any).name) &&
        !functions.has((node as any).name)
      )
        throw new Error(`Unsupported symbol: ${(node as any).name}`);
    } else if (node.type === "FunctionNode") {
      if (!functions.has((node as any).name))
        throw new Error(`Unsupported function: ${(node as any).name}`);
    } else if (node.type === "OperatorNode") {
      if (!operators.has((node as any).op))
        throw new Error(`Unsupported operator: ${(node as any).op}`);
    } else if (!["ConstantNode", "ParenthesisNode"].includes(node.type)) {
      throw new Error(`Unsupported syntax: ${node.type}`);
    }
  });
  return root;
}

export function numberAt(input: string, scope: Record<string, number>): number {
  const node = safeParse(input);
  const value = node.evaluate(scope);
  if (typeof value !== "number" || !Number.isFinite(value)) return NaN;
  return value;
}

type Poly = number[];
const trim = (p: Poly): Poly => {
  const q = [...p];
  while (q.length > 1 && Math.abs(q.at(-1)!) < 1e-10) q.pop();
  return q;
};
const add = (a: Poly, b: Poly, sign = 1): Poly =>
  trim(
    Array.from(
      { length: Math.max(a.length, b.length) },
      (_, i) => (a[i] || 0) + sign * (b[i] || 0),
    ),
  );
const mul = (a: Poly, b: Poly): Poly => {
  const r = Array(a.length + b.length - 1).fill(0);
  a.forEach((v, i) => b.forEach((w, j) => (r[i + j] += v * w)));
  if (r.length > 5)
    throw new Error("Polynomial degree above four is not supported here.");
  return trim(r);
};
const power = (a: Poly, n: number): Poly => {
  if (!Number.isInteger(n) || n < 0 || n > 4)
    throw new Error("Use a nonnegative integer power up to four.");
  let r = [1];
  for (let i = 0; i < n; i++) r = mul(r, a);
  return r;
};
type Rational = { n: Poly; d: Poly; restrictions: string[] };
function rational(node: MathNode, variable: string): Rational {
  if (node.type === "ParenthesisNode")
    return rational((node as any).content, variable);
  if (node.type === "ConstantNode")
    return { n: [Number((node as any).value)], d: [1], restrictions: [] };
  if (node.type === "SymbolNode") {
    const name = (node as any).name;
    if (name === variable) return { n: [0, 1], d: [1], restrictions: [] };
    if (name === "pi") return { n: [Math.PI], d: [1], restrictions: [] };
    if (name === "e") return { n: [Math.E], d: [1], restrictions: [] };
    throw new Error(
      `Choose ${name} as the variable, or provide a number for it.`,
    );
  }
  if (node.type !== "OperatorNode")
    throw new Error(
      "Polynomial solving supports arithmetic expressions; try Simplify or Differentiate for this input.",
    );
  const op = (node as any).op as string,
    args = (node as any).args as MathNode[];
  if (args.length === 1 && op === "-") {
    const a = rational(args[0], variable);
    return { ...a, n: a.n.map((v) => -v) };
  }
  const a = rational(args[0], variable),
    b = rational(args[1], variable);
  const restrictions = [...a.restrictions, ...b.restrictions];
  if (op === "+")
    return {
      n: add(mul(a.n, b.d), mul(b.n, a.d)),
      d: mul(a.d, b.d),
      restrictions,
    };
  if (op === "-")
    return {
      n: add(mul(a.n, b.d), mul(b.n, a.d), -1),
      d: mul(a.d, b.d),
      restrictions,
    };
  if (op === "*") return { n: mul(a.n, b.n), d: mul(a.d, b.d), restrictions };
  if (op === "/")
    return {
      n: mul(a.n, b.d),
      d: mul(a.d, b.n),
      restrictions: [...restrictions, `${args[1].toString()} ≠ 0`],
    };
  if (op === "^" && b.n.length === 1 && b.d.length === 1 && b.d[0] === 1)
    return { n: power(a.n, b.n[0]), d: power(a.d, b.n[0]), restrictions };
  throw new Error("This operation is outside the polynomial solver subset.");
}
const eq = (a: number, b: number) =>
  Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
const rationalText = (n: number): string | null => {
  const near = (a: number, b: number) =>
    Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
  if (near(n, Math.round(n))) return String(Math.round(n));
  for (let d = 2; d <= 100; d++) {
    const k = Math.round(n * d);
    if (near(n, k / d)) return `${k}/${d}`;
  }
  return null;
};
const format = (n: number) =>
  rationalText(n) ?? Number(n.toPrecision(10)).toString();
function roots(p: Poly): number[] {
  p = trim(p);
  if (p.length === 1) return [];
  if (p.length === 2) return [-p[0] / p[1]];
  if (p.length === 3) {
    const [c, b, a] = p,
      dis = b * b - 4 * a * c;
    if (dis < 0) return [];
    if (eq(dis, 0)) return [-b / (2 * a)];
    return [
      (-b - Math.sqrt(dis)) / (2 * a),
      (-b + Math.sqrt(dis)) / (2 * a),
    ].sort((x, y) => x - y);
  }
  throw new Error(
    "Exact solving currently covers linear and quadratic equations.",
  );
}
function divide(n: Poly, d: Poly): { quotient: Poly; remainder: Poly } {
  n = trim(n);
  d = trim(d);
  if (d.length === 1 && eq(d[0], 0)) throw new Error("Division by zero.");
  const quotient = Array(Math.max(1, n.length - d.length + 1)).fill(0),
    remainder = [...n];
  while (
    remainder.length >= d.length &&
    !(remainder.length === 1 && eq(remainder[0], 0))
  ) {
    const degree = remainder.length - d.length,
      factor = remainder.at(-1)! / d.at(-1)!;
    quotient[degree] = factor;
    for (let i = 0; i < d.length; i++) remainder[degree + i] -= factor * d[i];
    const next = trim(remainder);
    remainder.splice(0, remainder.length, ...next);
  }
  return { quotient: trim(quotient), remainder: trim(remainder) };
}
function polyText(p: Poly, variable: string) {
  return (
    p
      .map((coefficient, i) => ({ coefficient, i }))
      .filter(({ coefficient }) => !eq(coefficient, 0))
      .reverse()
      .map(({ coefficient, i }, index) => {
        const abs = Math.abs(coefficient),
          body = i
            ? `${eq(abs, 1) ? "" : `${format(abs)}*`}${variable}${i > 1 ? `^${i}` : ""}`
            : format(abs);
        return `${index ? (coefficient < 0 ? " - " : " + ") : coefficient < 0 ? "-" : ""}${body}`;
      })
      .join("") || "0"
  );
}
function radicalEquation(input: string, variable: string): SolveResult {
  const parts = input.split("=");
  if (parts.length !== 2) throw new Error("Enter one equals sign.");
  const left = safeParse(parts[0]),
    right = safeParse(parts[1]);
  const isRoot = (node: MathNode) =>
    node.type === "FunctionNode" && (node as any).name === "sqrt";
  const rootNode = isRoot(left) ? left : isRoot(right) ? right : null;
  if (!rootNode)
    throw new Error(
      "This equation is outside the supported polynomial and square-root subset.",
    );
  const other = rootNode === left ? right : left,
    inside = (rootNode as any).args[0] as MathNode;
  const a = rational(inside, variable),
    b = rational(other, variable);
  if (a.d.length !== 1 || b.d.length !== 1)
    throw new Error("This square-root equation has unsupported denominators.");
  const insidePoly = a.n.map((v) => v / a.d[0]),
    otherPoly = b.n.map((v) => v / b.d[0]);
  const p = add(power(otherPoly, 2), insidePoly, -1);
  const candidates = roots(p),
    valid = candidates.filter((x) => {
      const v = numberAt(parts[0], { [variable]: x }),
        w = numberAt(parts[1], { [variable]: x });
      return Number.isFinite(v) && Number.isFinite(w) && eq(v, w);
    });
  const answer = valid.length
    ? `${variable} = ${valid.map(format).join(" or ")}`
    : "No real solution in the stated domain.";
  const restrictions = [`${inside.toString()} ≥ 0`, `${other.toString()} ≥ 0`];
  return {
    input,
    operation: "Solve",
    answer,
    verification:
      "Every candidate was substituted into the original unsquared equation.",
    restrictions,
    warning:
      candidates.length > valid.length
        ? "Squaring introduced an extraneous root, which was discarded."
        : undefined,
    steps: [],
  };
}
function system(input: string): SolveResult {
  const rows = input
    .split(/[;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (rows.length !== 2)
    throw new Error(
      "Enter two equations separated by a semicolon or line break.",
    );
  const values = rows.map((row) => {
    const sides = row.split("=");
    if (sides.length !== 2)
      throw new Error("Each system line needs one equals sign.");
    const l = safeParse(sides[0]),
      r = safeParse(sides[1]);
    const f = (x: number, y: number) =>
      Number(l.evaluate({ x, y })) - Number(r.evaluate({ x, y }));
    const c = f(0, 0),
      ax = f(1, 0) - c,
      by = f(0, 1) - c;
    if (!eq(f(2, 3), 2 * ax + 3 * by + c))
      throw new Error("This system is not linear.");
    return { ax, by, c };
  });
  const [a, b] = values,
    d = a.ax * b.by - a.by * b.ax;
  if (eq(d, 0))
    throw new Error(
      "This system has no unique solution; dependent and inconsistent systems need separate analysis.",
    );
  const x = (-a.c * b.by + a.by * b.c) / d,
    y = (-a.ax * b.c + a.c * b.ax) / d;
  if (!values.every((v) => eq(v.ax * x + v.by * y + v.c, 0)))
    throw new Error("The computed pair did not pass the original system.");
  const answer = `x = ${format(x)}, y = ${format(y)}`;
  const steps: Step[] = [
    {
      before: input,
      after: `${format(a.ax)}x + ${format(a.by)}y = ${format(-a.c)}; ${format(b.ax)}x + ${format(b.by)}y = ${format(-b.c)}`,
      ruleId: "system-standard",
      explanation: "Collect x and y terms in each equation.",
      verified: true,
    },
    {
      before: "Linear system",
      after: answer,
      ruleId: "cramer",
      explanation: `Solve the coefficient system with determinant ${format(d)}, then substitute into both original equations.`,
      verified: true,
      conditions: [`${format(d)} ≠ 0`],
    },
  ];
  return {
    input,
    operation: "Solve",
    answer,
    verification: "Both original equations accept this pair.",
    steps,
    restrictions: [],
  };
}
function equation(input: string, variable: string): SolveResult {
  if (input.includes(";") || input.includes("\n")) return system(input);
  const parts = input.split("=");
  if (parts.length !== 2) throw new Error("Enter exactly one equals sign.");
  const left = safeParse(parts[0]),
    right = safeParse(parts[1]);
  let a: Rational, b: Rational;
  try {
    a = rational(left, variable);
    b = rational(right, variable);
  } catch (error) {
    if (left.toString().includes("sqrt(") || right.toString().includes("sqrt("))
      return radicalEquation(input, variable);
    throw error;
  }
  const n = add(mul(a.n, b.d), mul(b.n, a.d), -1),
    d = mul(a.d, b.d);
  const restrictions = [...new Set([...a.restrictions, ...b.restrictions])];
  if (n.length === 1 && eq(n[0], 0))
    return {
      input,
      operation: "Solve",
      answer: "All values in the stated domain satisfy this identity.",
      verification: "Both sides simplify to the same expression.",
      steps: [],
      restrictions,
    };
  const candidates = roots(n),
    valid = candidates.filter((x) => {
      const scope = { [variable]: x };
      const l = numberAt(parts[0], scope),
        r = numberAt(parts[1], scope);
      return Number.isFinite(l) && Number.isFinite(r) && eq(l, r);
    });
  const irrational = valid.some((x) => rationalText(x) === null);
  const disc = n.length === 3 ? n[1] * n[1] - 4 * n[2] * n[0] : undefined;
  const answer = valid.length
    ? irrational && disc !== undefined
      ? `${variable} = (${-n[1]} ± sqrt(${format(disc)}))/(2*${format(n[2])})`
      : `${variable} = ${valid.map(format).join(" or ")}`
    : "No real solution in the supported domain.";
  const approximate = irrational
    ? `${variable} ≈ ${valid.map(format).join(" or ")}`
    : undefined;
  const steps: Step[] = [];
  if (d.length === 1 && eq(d[0], 1) && n.length === 2 && valid.length === 1) {
    const [c, k] = n;
    const after = `${format(k)}*${variable} = ${format(-c)}`;
    steps.push({
      before: input,
      after,
      ruleId: "collect-linear",
      explanation: "Collect variable terms and constants on opposite sides.",
      verified: eq(k * valid[0], -c),
    });
    steps.push({
      before: after,
      after: `${variable} = ${format(valid[0])}`,
      ruleId: "divide-coefficient",
      explanation: `Divide both sides by ${format(k)}.`,
      verified: !eq(k, 0) && eq(k * valid[0], -c),
      conditions: [`${format(k)} ≠ 0`],
    });
  } else if (d.length === 1 && eq(d[0], 1) && n.length === 3 && valid.length) {
    const [c, b, a] = n;
    const disc = b * b - 4 * a * c;
    steps.push({
      before: input,
      after: `${polyText(n, variable)} = 0`,
      ruleId: "standard-form",
      explanation: "Move all terms to one side and collect powers.",
      verified: eq(a * valid[0] ** 2 + b * valid[0] + c, 0),
    });
    steps.push({
      before: steps[0].after,
      after: `discriminant = ${format(disc)}`,
      ruleId: "discriminant",
      explanation: "Compute b² − 4ac to determine the real roots.",
      verified: eq(disc, b * b - 4 * a * c),
    });
    steps.push({
      before: steps[1].after,
      after: answer,
      ruleId: "quadratic-formula",
      explanation:
        "Apply x = (−b ± √discriminant)/(2a), then check each root in the original equation.",
      verified: valid.every((x) => eq(a * x * x + b * x + c, 0)),
    });
  }
  const verification = valid.length
    ? `Substitution into the original equation checks ${valid.length} solution${valid.length === 1 ? "" : "s"}.`
    : "No candidate passed the original equation and domain check.";
  return {
    input,
    operation: "Solve",
    answer,
    approximate,
    verification,
    steps,
    restrictions,
    warning:
      candidates.length > valid.length
        ? "An extraneous or undefined candidate was discarded."
        : undefined,
  };
}
export function solve(
  input: string,
  operation: string,
  variable = "x",
  lower?: number,
  upper?: number,
): SolveResult {
  input = input.trim();
  if (!symbols.has(variable) || ["pi", "e"].includes(variable))
    throw new Error("Choose x, y, or t as the variable.");
  if (operation === "Solve") return equation(input, variable);
  if (operation === "Determinant" || operation === "Inverse") {
    let matrix: unknown;
    try {
      matrix = JSON.parse(input);
    } catch {
      throw new Error("Enter a matrix as JSON, for example [[1,2],[3,4]].");
    }
    if (
      !Array.isArray(matrix) ||
      matrix.length < 1 ||
      matrix.length > 4 ||
      !matrix.every(
        (row) =>
          Array.isArray(row) &&
          row.length === matrix.length &&
          row.every(
            (v: unknown) => typeof v === "number" && Number.isFinite(v),
          ),
      )
    )
      throw new Error("Enter a square numeric matrix up to 4×4.");
    const determinant = Number(det(matrix as number[][]));
    if (operation === "Determinant")
      return {
        input,
        operation,
        answer: format(determinant),
        verification: "Computed using matrix determinant.",
        steps: [],
        restrictions: [],
      };
    if (eq(determinant, 0))
      throw new Error("This matrix is singular, so it has no inverse.");
    return {
      input,
      operation,
      answer: JSON.stringify(inv(matrix as number[][])),
      verification: `Determinant ${format(determinant)} is nonzero.`,
      steps: [],
      restrictions: [],
    };
  }
  const node = safeParse(input);
  if (operation === "Simplify") {
    let out = simplify(node).toString(),
      restrictions: string[] = [],
      steps: Step[] = [];
    try {
      const r = rational(node, variable);
      restrictions = r.restrictions;
      const divided = divide(r.n, r.d);
      if (divided.remainder.every((v) => eq(v, 0))) {
        out = polyText(divided.quotient, variable);
        if (restrictions.length)
          steps = [
            {
              before: input,
              after: out,
              ruleId: "fraction-cancellation",
              explanation:
                "Divide numerator by denominator, keeping the original excluded values.",
              verified: mul(divided.quotient, r.d).every((v, i) =>
                eq(v, r.n[i] || 0),
              ),
              conditions: restrictions,
            },
          ];
      }
    } catch {}
    return {
      input,
      operation,
      answer: out,
      verification:
        "Symbolic simplification; original denominator exclusions are retained when a rational polynomial is recognized.",
      steps,
      restrictions,
    };
  }
  if (operation === "Differentiate") {
    const out = derivative(node, variable).toString();
    return {
      input,
      operation,
      answer: out,
      verification: `Differentiated with respect to ${variable}.`,
      steps: [],
      restrictions: [],
    };
  }
  if (operation === "Evaluate") {
    if (!/\b(pi|e)\b/.test(input)) {
      try {
        const r = rational(node, variable);
        if (r.n.length === 1 && r.d.length === 1 && r.d[0] !== 0)
          return {
            input,
            operation,
            answer: format(r.n[0] / r.d[0]),
            verification: "Evaluated by rational arithmetic.",
            steps: [],
            restrictions: r.restrictions,
          };
      } catch {}
    }
    const val = node.evaluate();
    if (typeof val === "number" && !Number.isFinite(val))
      throw new Error("This expression has no finite numeric value.");
    return {
      input,
      operation,
      answer: String(val),
      verification: "Evaluated using math.js.",
      steps: [],
      restrictions: [],
    };
  }
  if (operation === "Integrate" || operation === "Definite integral") {
    const r = rational(node, variable);
    if (r.d.length !== 1)
      throw new Error("Integration currently supports polynomials only.");
    const p = r.n.map((v) => v / r.d[0]);
    const integral = [0, ...p.map((v, i) => v / (i + 1))];
    const out = polyText(integral, variable);
    const check = derivative(parse(out), variable);
    if (operation === "Integrate")
      return {
        input,
        operation,
        answer: `${out} + C`,
        verification: `Differentiating the antiderivative returns ${simplify(check).toString()}.`,
        steps: [],
        restrictions: r.restrictions,
      };
    if (
      lower === undefined ||
      upper === undefined ||
      !Number.isFinite(lower) ||
      !Number.isFinite(upper)
    )
      throw new Error("Enter finite lower and upper bounds.");
    const antiderivative = (x: number) =>
      integral.reduce((sum, v, i) => sum + v * x ** i, 0);
    return {
      input,
      operation,
      answer: format(antiderivative(upper) - antiderivative(lower)),
      verification: `Fundamental theorem of calculus: F(${upper}) − F(${lower}), where F(${variable}) = ${out}.`,
      steps: [],
      restrictions: r.restrictions,
    };
  }

  throw new Error("This operation is not available.");
}

export function sample2D(
  input: string,
  min = -10,
  max = 10,
  samples = 500,
): GraphPoint[] {
  const node = safeParse(input),
    count = Math.min(1000, Math.max(40, Math.floor(samples)));
  const points: GraphPoint[] = [];
  for (let i = 0; i <= count; i++) {
    const x = min + ((max - min) * i) / count;
    let y: number;
    try {
      const v = node.evaluate({ x });
      y = typeof v === "number" ? v : NaN;
    } catch {
      y = NaN;
    }
    const previous = points.at(-1);
    const jump =
      previous &&
      previous[1] !== null &&
      Number.isFinite(y) &&
      Math.sign(previous[1]) !== Math.sign(y) &&
      Math.abs(y - previous[1]) > Math.max(30, (max - min) * 6);
    if (jump) points.push([x, null]);
    points.push([x, Number.isFinite(y) && Math.abs(y) < 1e6 ? y : null]);
  }
  return points;
}
export function sample3D(input: string, bound = 5, resolution = 36) {
  const node = safeParse(input);
  const n = Math.min(60, Math.max(12, Math.floor(resolution)));
  const x = Array.from(
      { length: n },
      (_, i) => -bound + (2 * bound * i) / (n - 1),
    ),
    y = [...x];
  const z = y.map((yy) =>
    x.map((xx) => {
      try {
        const v = node.evaluate({ x: xx, y: yy });
        return typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e5
          ? v
          : null;
      } catch {
        return null;
      }
    }),
  );
  return { x, y, z };
}
