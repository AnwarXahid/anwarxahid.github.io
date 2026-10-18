import { useEffect, useRef, useState } from "react";
import { runMath } from "../math/workerClient";
import type { GraphPoint } from "../math/engine";

type Curve = {
  id: string;
  name: string;
  input: string;
  color: string;
  visible: boolean;
};
export type GraphSettings = {
  mode: "2d" | "3d";
  curves: Curve[];
  surface: string;
  min: number;
  max: number;
  bound: number;
};
const palette = ["#087e8b", "#e46d46", "#7066b4", "#529568", "#cf9d31"];
function fromEditor(expression: string) {
  const parts = expression.split("=");
  return parts.length === 2 ? `(${parts[0]})-(${parts[1]})` : expression;
}
export function validateGraphSettings(value: unknown): GraphSettings {
  const x = value as any;
  if (
    !x ||
    !["2d", "3d"].includes(x.mode) ||
    !Array.isArray(x.curves) ||
    !x.curves.length ||
    x.curves.length > 10 ||
    !x.curves.every(
      (c: any) =>
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        c.name.length <= 80 &&
        typeof c.input === "string" &&
        c.input.length <= 240 &&
        /^#[0-9a-f]{6}$/i.test(c.color) &&
        typeof c.visible === "boolean",
    ) ||
    typeof x.surface !== "string" ||
    x.surface.length > 240 ||
    !Number.isFinite(x.min) ||
    !Number.isFinite(x.max) ||
    x.min >= x.max ||
    x.max - x.min > 200 ||
    !Number.isFinite(x.bound) ||
    x.bound < 1 ||
    x.bound > 20
  )
    throw new Error("Invalid graph settings.");
  return x as GraphSettings;
}
export default function Graph({
  expression,
  initial,
  onSave,
}: {
  expression: string;
  initial?: GraphSettings;
  onSave: (settings: GraphSettings) => void;
}) {
  const [mode, setMode] = useState<"2d" | "3d">(initial?.mode || "2d");
  const [curves, setCurves] = useState<Curve[]>(
    initial?.curves || [
      {
        id: crypto.randomUUID(),
        name: "From editor",
        input: fromEditor(expression) || "sin(x)",
        color: palette[0],
        visible: true,
      },
    ],
  );
  const [surface, setSurface] = useState(initial?.surface || "sin(x)*cos(y)");
  const [min, setMin] = useState(initial?.min ?? -10);
  const [max, setMax] = useState(initial?.max ?? 10);
  const [bound, setBound] = useState(initial?.bound ?? 5);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const plot = useRef<HTMLDivElement>(null);
  const plotly = useRef<any>(null);
  useEffect(() => {
    let active = true;
    async function draw() {
      if (!plot.current) return;
      setBusy(true);
      setStatus("Computing graph…");
      try {
        const Plotly = (await import("plotly.js-dist-min")).default;
        plotly.current = Plotly;
        if (mode === "2d") {
          if (!(min < max) || max - min > 200)
            throw new Error(
              "Choose an x range under 200 with minimum below maximum.",
            );
          const traces = await Promise.all(
            curves
              .filter((c) => c.visible && c.input.trim())
              .map(async (c) => {
                const points = await runMath<GraphPoint[]>("graph2d", {
                  input: c.input,
                  min,
                  max,
                  samples: 600,
                });
                return {
                  type: "scatter",
                  mode: "lines",
                  name: c.name,
                  x: points.map((p) => p[0]),
                  y: points.map((p) => p[1]),
                  line: { color: c.color, width: 2.5 },
                  connectgaps: false,
                };
              }),
          );
          if (!active) return;
          await Plotly.react(
            plot.current!,
            traces,
            {
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#394b60", size: 12 },
              margin: { l: 50, r: 20, t: 24, b: 50 },
              xaxis: {
                title: { text: "x" },
                range: [min, max],
                zerolinecolor: "#8795a3",
                gridcolor: "#dce5e9",
              },
              yaxis: {
                title: { text: "y" },
                zerolinecolor: "#8795a3",
                gridcolor: "#dce5e9",
              },
              showlegend: traces.length > 1,
            },
            {
              responsive: true,
              displaylogo: false,
              modeBarButtonsToRemove: ["sendDataToCloud"],
            },
          );
        } else {
          const data = await runMath<{
            x: number[];
            y: number[];
            z: (number | null)[][];
          }>("graph3d", { input: surface, bound, resolution: 36 }, 12000);
          if (!active) return;
          await Plotly.react(
            plot.current!,
            [
              {
                type: "surface",
                ...data,
                colorscale: "Viridis",
                connectgaps: false,
                showscale: true,
              },
            ],
            {
              paper_bgcolor: "transparent",
              font: { color: "#394b60" },
              margin: { l: 5, r: 5, t: 10, b: 5 },
              scene: {
                xaxis: { title: "x" },
                yaxis: { title: "y" },
                zaxis: { title: "z" },
              },
            },
            { responsive: true, displaylogo: false },
          );
        }
        setStatus("Graph ready. Drag to pan or rotate; scroll to zoom.");
      } catch (error) {
        if (active)
          setStatus(
            error instanceof Error
              ? error.message
              : "Could not draw this graph.",
          );
      } finally {
        if (active) setBusy(false);
      }
    }
    void draw();
    return () => {
      active = false;
    };
  }, [mode, curves, min, max, bound, surface]);
  useEffect(
    () => () => {
      if (plot.current && plotly.current) plotly.current.purge(plot.current);
    },
    [],
  );
  const edit = (id: string, patch: Partial<Curve>) =>
    setCurves((old) => old.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  function move(id: string, direction: number) {
    setCurves((old) => {
      const index = old.findIndex((c) => c.id === id),
        target = index + direction;
      if (target < 0 || target >= old.length) return old;
      const next = [...old];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  return (
    <section className="ms-panel">
      <div className="ms-heading">
        <div>
          <span className="ms-kicker">03 / GRAPH</span>
          <h2>Explore the shape</h2>
          <p>
            Safe mathematical expressions, interactive axes, and local image
            export.
          </p>
        </div>
        <div className="ms-segment">
          <button aria-pressed={mode === "2d"} onClick={() => setMode("2d")}>
            2D
          </button>
          <button aria-pressed={mode === "3d"} onClick={() => setMode("3d")}>
            3D
          </button>
        </div>
      </div>
      {mode === "2d" ? (
        <>
          <div className="ms-curves">
            {curves.map((c, i) => (
              <div className="ms-curve" key={c.id}>
                <input
                  type="color"
                  value={c.color}
                  aria-label={`${c.name} color`}
                  onChange={(e) => edit(c.id, { color: e.target.value })}
                />
                <label className="ms-vis">
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={(e) => edit(c.id, { visible: e.target.checked })}
                  />
                  <span className="ms-sr">Show {c.name}</span>
                </label>
                <input
                  aria-label={`Name for curve ${i + 1}`}
                  value={c.name}
                  onChange={(e) => edit(c.id, { name: e.target.value })}
                />
                <span>y =</span>
                <input
                  aria-label={`Expression for curve ${i + 1}`}
                  value={c.input}
                  onChange={(e) => edit(c.id, { input: e.target.value })}
                />
                <button
                  title="Move curve up"
                  disabled={i === 0}
                  onClick={() => move(c.id, -1)}
                >
                  ↑
                </button>
                <button
                  title="Move curve down"
                  disabled={i === curves.length - 1}
                  onClick={() => move(c.id, 1)}
                >
                  ↓
                </button>
                <button
                  title="Duplicate curve"
                  onClick={() =>
                    setCurves([
                      ...curves,
                      { ...c, id: crypto.randomUUID(), name: `${c.name} copy` },
                    ])
                  }
                >
                  Duplicate
                </button>
                <button
                  title="Delete curve"
                  disabled={curves.length === 1}
                  onClick={() => setCurves(curves.filter((x) => x.id !== c.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="ms-toolbar">
            <button
              onClick={() =>
                setCurves([
                  ...curves,
                  {
                    id: crypto.randomUUID(),
                    name: `Curve ${curves.length + 1}`,
                    input: "cos(x)",
                    color: palette[curves.length % palette.length],
                    visible: true,
                  },
                ])
              }
            >
              + Add curve
            </button>
            <button
              onClick={() =>
                setCurves([
                  ...curves,
                  {
                    id: crypto.randomUUID(),
                    name: "From editor",
                    input: fromEditor(expression),
                    color: palette[curves.length % palette.length],
                    visible: true,
                  },
                ])
              }
            >
              Add editor expression
            </button>
            <label>
              Min x{" "}
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
              />
            </label>
            <label>
              Max x{" "}
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
              />
            </label>
            <button
              onClick={() => {
                setMin(-10);
                setMax(10);
              }}
            >
              Reset range
            </button>
          </div>
        </>
      ) : (
        <div className="ms-toolbar">
          <label>
            z ={" "}
            <input
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              aria-label="3D surface expression"
            />
          </label>
          <label>
            ± bounds{" "}
            <input
              type="number"
              min="1"
              max="20"
              value={bound}
              onChange={(e) =>
                setBound(Math.max(1, Math.min(20, Number(e.target.value))))
              }
            />
          </label>
        </div>
      )}
      <div
        ref={plot}
        className="ms-plot"
        role="img"
        aria-label={
          mode === "2d"
            ? "Interactive 2D mathematical graph"
            : "Interactive 3D mathematical surface"
        }
      ></div>
      <div className="ms-toolbar">
        <p role="status">{busy ? "Working…" : status}</p>
        <button
          onClick={() => {
            onSave({ mode, curves, surface, min, max, bound });
            setStatus("Graph settings saved to the local notebook.");
          }}
        >
          Save graph to notebook
        </button>
        <button
          disabled={busy || !plotly.current}
          onClick={() =>
            void plotly.current.downloadImage(plot.current, {
              format: "png",
              filename: "openmath-graph",
              width: 1200,
              height: 800,
            })
          }
        >
          Download PNG
        </button>
        <button
          disabled={busy || !plotly.current}
          onClick={() =>
            void plotly.current.downloadImage(plot.current, {
              format: "svg",
              filename: "openmath-graph",
              width: 1200,
              height: 800,
            })
          }
        >
          Download SVG
        </button>
      </div>
    </section>
  );
}
