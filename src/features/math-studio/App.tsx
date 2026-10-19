import { Suspense, lazy, useEffect, useState } from "react";
import type { SolveResult } from "./math/engine";
import { runMath, stopMath } from "./math/workerClient";
import { runCas, stopCas } from "./math/casClient";
import type { GraphSettings } from "./components/Graph";
import {
  deleteNotebook,
  listNotebooks,
  saveNotebook,
  validateNotebook,
  type Notebook,
  type Card,
} from "./data/notebooks";
import "./studio.css";
const Graph = lazy(() => import("./components/Graph"));
const Scan = lazy(() => import("./components/Scan"));
const VisualEditor = lazy(() => import("./components/VisualEditor"));
const Preview = lazy(() => import("./components/Preview"));
type Tab = "Solve" | "Graph" | "Scan" | "Editor" | "Notebook";
const tabs: Tab[] = ["Solve", "Graph", "Scan", "Editor", "Notebook"];
let notebookWrites: Promise<unknown> = Promise.resolve();
function download(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const makeBook = (): Notebook => ({
  id: crypto.randomUUID(),
  name: "My notebook",
  cards: [],
  updated: Date.now(),
});
export default function App() {
  const [tab, setTab] = useState<Tab>("Solve");
  const [expression, setExpression] = useState("2x+3=11");
  const [latex, setLatex] = useState("");
  const [operation, setOperation] = useState("Solve");
  const [variable, setVariable] = useState("x");
  const [lower, setLower] = useState(0);
  const [upper, setUpper] = useState(1);
  const [result, setResult] = useState<SolveResult>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof localStorage === "undefined"
      ? "light"
      : localStorage.getItem("openmath.theme") === "dark"
        ? "dark"
        : "light",
  );
  const [books, setBooks] = useState<Notebook[]>([]);
  const [bookId, setBookId] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [search, setSearch] = useState("");
  const [graphSettings, setGraphSettings] = useState<GraphSettings>();
  const [about, setAbout] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    void listNotebooks()
      .then((items) => {
        setBooks(items);
        if (items.length) setBookId(items[0].id);
      })
      .catch(() =>
        setNoteStatus("Local notebook storage is unavailable in this browser."),
      );
    return () => {
      stopMath();
      stopCas();
    };
  }, []);
  useEffect(() => {
    localStorage.setItem("openmath.theme", theme);
  }, [theme]);
  const book = books.find((b) => b.id === bookId);
  function updateExpression(value: string) {
    if (value === expression) return;
    setHistory((old) => [...old.slice(-29), expression]);
    setExpression(value);
    setResult(undefined);
    setError("");
  }
  async function solve() {
    setBusy(true);
    setError("");
    setResult(undefined);
    setProgress("");
    try {
      const output = operation.startsWith("CAS ")
        ? await runCas(
            { input: expression, operation, variable, lower, upper },
            setProgress,
          )
        : await runMath<SolveResult>("solve", {
            input: expression,
            operation,
            variable,
            lower,
            upper,
          });
      setResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed.");
    } finally {
      setBusy(false);
    }
  }
  async function persist(next: Notebook) {
    setBooks((old) =>
      old.some((b) => b.id === next.id)
        ? old.map((b) => (b.id === next.id ? next : b))
        : [...old, next],
    );
    setBookId(next.id);
    try {
      notebookWrites = notebookWrites
        .catch(() => {})
        .then(() => saveNotebook(next));
      await notebookWrites;
      setNoteStatus("Saved in this browser.");
    } catch (e) {
      setNoteStatus(
        e instanceof Error ? e.message : "Could not save notebook.",
      );
    }
  }
  function addCard(kind: Card["kind"], content: string) {
    const current = book || makeBook();
    void persist({
      ...current,
      cards: [
        ...current.cards,
        { id: crypto.randomUUID(), kind, content, created: Date.now() },
      ],
      updated: Date.now(),
    });
  }
  function moveCard(id: string, direction: number) {
    if (!book) return;
    const index = book.cards.findIndex((card) => card.id === id);
    const target = index + direction;
    if (target < 0 || target >= book.cards.length) return;
    const cards = [...book.cards];
    [cards[index], cards[target]] = [cards[target], cards[index]];
    void persist({ ...book, cards, updated: Date.now() });
  }
  return (
    <div className={`ms-app ms-${theme}`}>
      <aside className="ms-sidebar">
        <a className="ms-brand" href="/math/">
          <span className="ms-brandmark">∑</span>
          <span>
            <strong>OpenMath</strong>
            <small>STUDIO</small>
          </span>
        </a>
        <p className="ms-side-label">WORKSPACE</p>
        <nav aria-label="Math studio tools">
          {tabs.map((item, i) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => setTab(item)}
            >
              <span className="ms-nav-number">0{i + 1}</span>
              {item}
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </nav>
        <div className="ms-side-foot">
          <button onClick={() => setAbout(true)}>About this studio</button>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "☾ Dark" : "☀ Light"} theme
          </button>
          <a href="/lab/">← Back to the Lab</a>
        </div>
      </aside>
      <div className="ms-main">
        <header className="ms-top">
          <div>
            <span className="ms-top-label">
              A PRIVATE MATHEMATICS WORKSPACE
            </span>
            <h1>Scan it. Understand it. Solve it. Graph it.</h1>
          </div>
          <span className="ms-local">
            <span></span> Local-first · No account
          </span>
        </header>
        <main>
          {tab === "Solve" && (
            <section className="ms-panel">
              <div className="ms-heading">
                <div>
                  <span className="ms-kicker">02 / SOLVE</span>
                  <h2>Work through a problem</h2>
                  <p>
                    Enter standard notation, choose an operation, and inspect
                    checked results.
                  </p>
                </div>
              </div>
              <div className="ms-example">
                <span>Try a problem</span>
                {["2x+3=11", "x^2-5x+6=0", "1/(x-2)=3", "x^3*sin(x)"].map(
                  (x) => (
                    <button key={x} onClick={() => updateExpression(x)}>
                      {x}
                    </button>
                  ),
                )}
              </div>
              <label className="ms-field" htmlFor="solve-input">
                Expression or equation
                <textarea
                  id="solve-input"
                  value={expression}
                  onChange={(e) => updateExpression(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  placeholder="2x+3=11"
                />
              </label>
              <div className="ms-toolbar">
                <label>
                  Operation{" "}
                  <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                  >
                    {[
                      "Solve",
                      "Simplify",
                      "Differentiate",
                      "Integrate",
                      "Definite integral",
                      "Evaluate",
                      "Determinant",
                      "Inverse",
                      "CAS solve",
                      "CAS factor",
                      "CAS expand",
                      "CAS simplify",
                      "CAS integrate",
                      "CAS definite integral",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Variable{" "}
                  <select
                    value={variable}
                    onChange={(e) => setVariable(e.target.value)}
                  >
                    <option>x</option>
                    <option>y</option>
                    <option>t</option>
                  </select>
                </label>
                {(operation === "Definite integral" ||
                  operation === "CAS definite integral") && (
                  <>
                    <label>
                      From{" "}
                      <input
                        type="number"
                        value={lower}
                        onChange={(e) => setLower(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      To{" "}
                      <input
                        type="number"
                        value={upper}
                        onChange={(e) => setUpper(Number(e.target.value))}
                      />
                    </label>
                  </>
                )}
                <button
                  className="ms-primary"
                  disabled={busy}
                  onClick={() => void solve()}
                >
                  {busy ? "Calculating…" : `${operation} expression`}
                </button>
                <button
                  disabled={!history.length}
                  onClick={() => {
                    setExpression(history.at(-1)!);
                    setHistory(history.slice(0, -1));
                  }}
                >
                  Undo edit
                </button>
              </div>
              {operation.startsWith("CAS ") && (
                <p className="ms-note">
                  Advanced CAS downloads Pyodide and SymPy from jsDelivr on
                  first use. It may use substantial memory; input stays on your
                  device.
                </p>
              )}
              {busy && progress && (
                <p role="status" className="ms-note">
                  {progress}
                </p>
              )}
              {error && (
                <p className="ms-error" role="alert">
                  {error}
                </p>
              )}
              {result && (
                <div className="ms-result" aria-live="polite">
                  <div className="ms-result-top">
                    <span>RESULT · {result.operation.toUpperCase()}</span>
                    <button
                      onClick={() =>
                        void navigator.clipboard.writeText(result.answer)
                      }
                    >
                      Copy answer
                    </button>
                  </div>
                  <strong>{result.answer}</strong>
                  {result.approximate && (
                    <p className="ms-approx">{result.approximate}</p>
                  )}
                  <p>{result.verification}</p>
                  {result.restrictions.length > 0 && (
                    <p>
                      <b>Restrictions:</b> {result.restrictions.join("; ")}
                    </p>
                  )}
                  {result.warning && (
                    <p className="ms-warning">{result.warning}</p>
                  )}
                  <div className="ms-toolbar">
                    <button
                      onClick={() =>
                        addCard(
                          "equation",
                          `${result.input}\n→ ${result.answer}`,
                        )
                      }
                    >
                      Save to notebook
                    </button>
                    <button
                      onClick={() =>
                        download(
                          "openmath-solution.txt",
                          "text/plain",
                          `${result.input}\n${result.answer}\n${result.verification}\n${result.steps.map((s) => `${s.explanation}: ${s.after}`).join("\n")}`,
                        )
                      }
                    >
                      Download solution
                    </button>
                  </div>
                  <div className="ms-steps">
                    <h3>Verified steps</h3>
                    {result.steps.length ? (
                      result.steps.map((step, i) => (
                        <div className="ms-step" key={i}>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          <div>
                            <strong>{step.after}</strong>
                            <p>{step.explanation}</p>
                            <small>
                              {step.verified
                                ? "✓ Checked against the supported algebra rule"
                                : "Unverified transformation"}
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>
                        Answer computed; verified teaching steps aren’t
                        available for this problem yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}
          {tab === "Graph" && (
            <Suspense
              fallback={
                <div className="ms-panel">Loading graphing engine…</div>
              }
            >
              <Graph
                expression={expression}
                initial={graphSettings}
                onSave={(settings) =>
                  addCard("graph", JSON.stringify(settings))
                }
              />
            </Suspense>
          )}
          {tab === "Scan" && (
            <Suspense
              fallback={<div className="ms-panel">Loading document tools…</div>}
            >
              <Scan
                onUse={(value) => {
                  updateExpression(value);
                  setTab("Editor");
                }}
              />
            </Suspense>
          )}
          {tab === "Editor" && (
            <section className="ms-panel">
              <div className="ms-heading">
                <div>
                  <span className="ms-kicker">04 / EDITOR</span>
                  <h2>Compose mathematics</h2>
                  <p>
                    Use the visual keyboard or standard notation. Changes are
                    shared with Solve and Graph.
                  </p>
                </div>
              </div>
              <Suspense fallback={<p>Loading math keyboard…</p>}>
                <VisualEditor
                  value={latex || expression}
                  onExpression={(ascii, tex) => {
                    updateExpression(ascii);
                    setLatex(tex);
                  }}
                />
              </Suspense>
              <label className="ms-field" htmlFor="editor-ascii">
                Editable standard notation
                <textarea
                  id="editor-ascii"
                  value={expression}
                  onChange={(e) => {
                    updateExpression(e.target.value);
                    setLatex("");
                  }}
                  rows={3}
                  spellCheck={false}
                />
              </label>
              <Suspense fallback={<p>Loading preview…</p>}>
                <Preview value={latex || expression} />
              </Suspense>
              <div className="ms-toolbar">
                <button onClick={() => setTab("Solve")}>Send to Solve</button>
                <button
                  onClick={() => {
                    setGraphSettings(undefined);
                    setTab("Graph");
                  }}
                >
                  Open Graph
                </button>
                <button
                  onClick={() =>
                    void navigator.clipboard.writeText(latex || expression)
                  }
                >
                  Copy {latex ? "LaTeX" : "text"}
                </button>
                <button onClick={() => addCard("equation", expression)}>
                  Save equation
                </button>
              </div>
            </section>
          )}
          {tab === "Notebook" && (
            <section className="ms-panel">
              <div className="ms-heading">
                <div>
                  <span className="ms-kicker">05 / NOTEBOOK</span>
                  <h2>Keep your working</h2>
                  <p>
                    Saved in this browser with IndexedDB. Export a copy before
                    clearing browser data.
                  </p>
                </div>
                <button
                  className="ms-primary"
                  onClick={() => void persist(makeBook())}
                >
                  New notebook
                </button>
              </div>
              <div className="ms-toolbar">
                <label>
                  Notebook{" "}
                  <select
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                  >
                    <option value="">Choose one</option>
                    {books.map((b) => (
                      <option value={b.id} key={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                {book && (
                  <>
                    <input
                      aria-label="Notebook name"
                      value={book.name}
                      onChange={(e) =>
                        void persist({
                          ...book,
                          name: e.target.value,
                          updated: Date.now(),
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        download(
                          `${book.name.replace(/[^a-z0-9_-]/gi, "_")}.json`,
                          "application/json",
                          JSON.stringify(book, null, 2),
                        )
                      }
                    >
                      Export JSON
                    </button>
                    <button onClick={() => window.print()}>
                      Print / Save PDF
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${book.name}?`))
                          void notebookWrites
                            .then(() => deleteNotebook(book.id))
                            .then(() => {
                              setBooks(books.filter((b) => b.id !== book.id));
                              setBookId("");
                            });
                      }}
                    >
                      Delete notebook
                    </button>
                  </>
                )}
                {!!books.length && (
                  <button
                    onClick={() => {
                      if (
                        !confirm(
                          "Delete all OpenMath notebooks from this browser?",
                        )
                      )
                        return;
                      void notebookWrites
                        .then(() =>
                          Promise.all(
                            books.map((item) => deleteNotebook(item.id)),
                          ),
                        )
                        .then(() => {
                          setBooks([]);
                          setBookId("");
                          setNoteStatus("All notebooks deleted.");
                        });
                    }}
                  >
                    Clear all notebooks
                  </button>
                )}
              </div>
              <label className="ms-import">
                Import notebook JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 5 * 1024 * 1024) {
                      setNoteStatus("Choose a JSON file smaller than 5 MB.");
                      return;
                    }
                    if (f)
                      void f
                        .text()
                        .then((s) => {
                          const imported = validateNotebook(JSON.parse(s));
                          return persist({
                            ...imported,
                            id: crypto.randomUUID(),
                          });
                        })
                        .catch((err) => setNoteStatus(err.message));
                  }}
                />
              </label>
              {book && (
                <>
                  <div className="ms-toolbar">
                    <button onClick={() => addCard("equation", expression)}>
                      Add current equation
                    </button>
                    <button onClick={() => addCard("text", "New note")}>
                      Add text note
                    </button>
                  </div>
                  <div className="ms-cards">
                    <label className="ms-field">
                      Search this notebook
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    {book.cards.length ? (
                      book.cards
                        .filter((card) =>
                          card.content
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((card) => (
                          <article className="ms-card" key={card.id}>
                            <div>
                              <span>{card.kind.toUpperCase()}</span>
                              <div className="ms-toolbar">
                                <button
                                  title="Move card up"
                                  onClick={() => moveCard(card.id, -1)}
                                >
                                  ↑
                                </button>
                                <button
                                  title="Move card down"
                                  onClick={() => moveCard(card.id, 1)}
                                >
                                  ↓
                                </button>
                                {card.kind === "graph" && (
                                  <button
                                    onClick={() => {
                                      void import("./components/Graph")
                                        .then(({ validateGraphSettings }) => {
                                          setGraphSettings(
                                            validateGraphSettings(
                                              JSON.parse(card.content),
                                            ),
                                          );
                                          setTab("Graph");
                                        })
                                        .catch((e) =>
                                          setNoteStatus(
                                            e instanceof Error
                                              ? e.message
                                              : "Invalid graph settings.",
                                          ),
                                        );
                                    }}
                                  >
                                    Open graph
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    void persist({
                                      ...book,
                                      cards: book.cards.filter(
                                        (c) => c.id !== card.id,
                                      ),
                                      updated: Date.now(),
                                    })
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <textarea
                              aria-label={`${card.kind} card`}
                              value={card.content}
                              rows={3}
                              onChange={(e) =>
                                void persist({
                                  ...book,
                                  cards: book.cards.map((c) =>
                                    c.id === card.id
                                      ? { ...c, content: e.target.value }
                                      : c,
                                  ),
                                  updated: Date.now(),
                                })
                              }
                            />
                          </article>
                        ))
                    ) : (
                      <p>No cards yet. Save a result or add a note.</p>
                    )}
                  </div>
                </>
              )}
              {!book && (
                <p className="ms-note">
                  Create a notebook to collect equations and notes.
                </p>
              )}
              {noteStatus && <p role="status">{noteStatus}</p>}
            </section>
          )}
        </main>
        <footer className="ms-footer">
          <span>OpenMath Studio · Browser-first mathematics</span>
          <span>
            Experimental release ·{" "}
            <a href="https://github.com/AnwarXahid/anwarxahid.github.io/issues">
              Feedback
            </a>
          </span>
        </footer>
      </div>
      <nav className="ms-bottom" aria-label="Mobile math tools">
        {tabs.map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      {about && (
        <div
          className="ms-modal-back"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAbout(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            className="ms-modal"
          >
            <button
              className="ms-close"
              onClick={() => setAbout(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="ms-kicker">ABOUT</span>
            <h2 id="about-title">Mathematics on your device</h2>
            <p>
              Typed expressions, graph data, and notebooks stay in this browser.
              Text OCR downloads open-source language data when first used; your
              image is processed locally. No account or paid service is
              required.
            </p>
            <p>
              The current solver covers a tested subset of real linear and
              quadratic equations, symbolic simplification and differentiation.
              Steps appear only for supported cases. Equation image and
              handwriting recognition are still being evaluated.
            </p>
            <a href="https://github.com/AnwarXahid/anwarxahid.github.io/issues">
              Report a problem ↗
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
