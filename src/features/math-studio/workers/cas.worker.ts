import { safeParse, type SolveResult } from "../math/engine";
import type { MathNode } from "mathjs";

type Tree = {
  type: "number" | "symbol" | "operator" | "function";
  value: string;
  args?: Tree[];
};
function tree(node: MathNode): Tree {
  if (node.type === "ParenthesisNode") return tree((node as any).content);
  if (node.type === "ConstantNode")
    return { type: "number", value: String((node as any).value) };
  if (node.type === "SymbolNode")
    return { type: "symbol", value: (node as any).name };
  if (node.type === "OperatorNode")
    return {
      type: "operator",
      value: (node as any).op,
      args: (node as any).args.map(tree),
    };
  if (node.type === "FunctionNode")
    return {
      type: "function",
      value: (node as any).name,
      args: (node as any).args.map(tree),
    };
  throw new Error("Unsupported expression node.");
}
function restrictions(node: MathNode): string[] {
  const output: string[] = [];
  node.traverse((part) => {
    if (part.type === "OperatorNode" && (part as any).op === "/")
      output.push(`${(part as any).args[1].toString()} ≠ 0`);
    if (part.type === "FunctionNode") {
      const name = (part as any).name;
      if (name === "sqrt")
        output.push(`${(part as any).args[0].toString()} ≥ 0`);
      if (name === "log" || name === "ln")
        output.push(`${(part as any).args[0].toString()} > 0`);
    }
  });
  return output;
}
const PYTHON = String.raw`
import json, sympy as sp

NAMES = {'x':sp.Symbol('x', real=True), 'y':sp.Symbol('y', real=True), 't':sp.Symbol('t', real=True), 'a':sp.Symbol('a', real=True), 'b':sp.Symbol('b', real=True), 'c':sp.Symbol('c', real=True), 'pi':sp.pi, 'e':sp.E}
FUNCS = {'sin':sp.sin,'cos':sp.cos,'tan':sp.tan,'asin':sp.asin,'acos':sp.acos,'atan':sp.atan,'sqrt':sp.sqrt,'log':sp.log,'ln':sp.log,'exp':sp.exp,'abs':sp.Abs}

def build(node):
    kind=node['type']; value=node['value']; args=[build(x) for x in node.get('args',[])]
    if kind=='number': return sp.Rational(value)
    if kind=='symbol': return NAMES[value]
    if kind=='function': return FUNCS[value](*args)
    if kind=='operator':
        if value=='+': return sp.Add(*args)
        if value=='-': return -args[0] if len(args)==1 else args[0]-args[1]
        if value=='*': return sp.Mul(*args)
        if value=='/': return args[0]/args[1]
        if value=='^': return args[0]**args[1]
    raise ValueError('Unsupported AST operation')

def run_task(raw):
    task=json.loads(raw)
    op=task['operation']; variable=NAMES[task['variable']]
    roots=task['trees']; original=task['input']
    expr=build(roots[0]); steps=[]; restrictions=task['restrictions']; approximate=None
    if op=='CAS solve':
        right=build(roots[1]); equation=sp.Eq(expr,right)
        found=sp.solveset(equation,variable,domain=sp.S.Reals)
        if isinstance(found,sp.FiniteSet):
            valid=[]
            for candidate in sorted(found,key=sp.default_sort_key):
                lhs=expr.subs(variable,candidate);rhs=right.subs(variable,candidate)
                if lhs.is_finite is not False and rhs.is_finite is not False and sp.simplify(lhs-rhs)==0: valid.append(candidate)
            answer=(str(variable)+' = '+' or '.join(sp.sstr(v) for v in valid)) if valid else 'No real solution.'
            verification='Each finite candidate was substituted into the original equation.'
            if valid and any(v.is_Rational is False for v in valid): approximate=str(variable)+' ≈ '+' or '.join(str(sp.N(v,10)) for v in valid)
        else:
            answer=sp.sstr(found);verification='SymPy returned a real solution set. Branch conditions require review.'
    elif op=='CAS factor':
        answer=sp.sstr(sp.factor(expr));verification='Symbolic factorization by SymPy.'
    elif op=='CAS expand':
        answer=sp.sstr(sp.expand(expr));verification='Symbolic expansion by SymPy.'
    elif op=='CAS simplify':
        answer=sp.sstr(sp.simplify(expr));verification='Symbolic simplification by SymPy. Review denominator domains.'
    elif op=='CAS integrate':
        result=sp.integrate(expr,variable)
        if result.has(sp.Integral): raise ValueError('SymPy did not find a closed-form antiderivative for this input.')
        answer=sp.sstr(result)+' + C';verification='Differentiating the antiderivative gives '+sp.sstr(sp.simplify(sp.diff(result,variable)))+'.'
    elif op=='CAS definite integral':
        low=sp.Rational(str(task['lower']));high=sp.Rational(str(task['upper']))
        result=sp.integrate(expr,(variable,low,high))
        if result.has(sp.Integral): raise ValueError('SymPy could not evaluate this definite integral symbolically.')
        answer=sp.sstr(result);approximate=str(sp.N(result,10));verification='Definite integral evaluated over ['+str(low)+', '+str(high)+'] by SymPy.'
    else: raise ValueError('Unsupported CAS operation.')
    return json.dumps({'input':original,'operation':op,'answer':answer,'approximate':approximate,'verification':verification,'steps':steps,'restrictions':restrictions})
`;
let pyodide: any;
async function load() {
  if (pyodide) return pyodide;
  self.postMessage({ progress: "Downloading the Python runtime…" });
  const url = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.mjs";
  const mod = await import(/* @vite-ignore */ url);
  pyodide = await mod.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
  });
  self.postMessage({ progress: "Loading SymPy…" });
  await pyodide.loadPackage("sympy");
  pyodide.runPython(PYTHON);
  return pyodide;
}
self.onmessage = async (
  event: MessageEvent<{
    id: number;
    input: string;
    operation: string;
    variable: string;
    lower?: number;
    upper?: number;
  }>,
) => {
  const { id, input, operation, variable, lower, upper } = event.data;
  try {
    if (input.length > 240) throw new Error("Expression is too long.");
    const parts = operation === "CAS solve" ? input.split("=") : [input];
    if (parts.length !== (operation === "CAS solve" ? 2 : 1))
      throw new Error("CAS solve needs one equals sign.");
    const parsed = parts.map((part) => safeParse(part));
    const trees = parsed.map(tree);
    const originalRestrictions = [...new Set(parsed.flatMap(restrictions))];
    if (!["x", "y", "t"].includes(variable))
      throw new Error("Choose x, y, or t.");
    if (
      operation === "CAS definite integral" &&
      (!Number.isFinite(lower) || !Number.isFinite(upper))
    )
      throw new Error("Enter finite bounds.");
    const runtime = await load();
    self.postMessage({ progress: "Computing with SymPy…" });
    runtime.globals.set(
      "task_json",
      JSON.stringify({
        input,
        operation,
        variable,
        lower,
        upper,
        trees,
        restrictions: originalRestrictions,
      }),
    );
    const output = JSON.parse(
      runtime.runPython("run_task(task_json)"),
    ) as SolveResult;
    self.postMessage({ id, result: output });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
