import { useState, useRef } from "react";
import { compareTexts, visualizeWhitespace, type DiffLine } from "./diff";
export default function TextCompare() {
  const [before, setBefore] = useState(""),
    [after, setAfter] = useState(""),
    [ignoreCase, setIgnoreCase] = useState(false),
    [ignoreWhitespace, setIgnoreWhitespace] = useState(false),
    [diffWords, setDiffWords] = useState(true),
    [exposeWhitespace, setExposeWhitespace] = useState(false),
    [changesOnly, setChangesOnly] = useState(false),
    [result, setResult] = useState<DiffLine[] | null>(null),
    [error, setError] = useState("");
  function lineLabel(text: string) {
    const count = text.replace(/\r\n?/g, "\n").split("\n").length;
    return `${count.toLocaleString()} ${count === 1 ? "line" : "lines"}`;
  }
  const version = useRef(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  function reset() {
    version.current++;
    setResult(null);
    setError("");
    setCopied(false);
    setCopyError("");
  }
  function compare() {
    try {
      setResult(
        compareTexts(before, after, {
          ignoreCase,
          ignoreWhitespace,
          diffWords,
        }),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }
  async function load(file: File | undefined, side: "before" | "after") {
    if (!file) return;
    reset();
    const request = version.current;
    if (file.size > 200000) {
      setError("Choose a text file smaller than 200 KB.");
      return;
    }
    try {
      const text = await file.text();
      if (request !== version.current) return;
      if (text.includes("\0")) {
        setError("This looks like a binary file. Choose a plain text file.");
        return;
      }
      (side === "before" ? setBefore : setAfter)(text);
    } catch {
      setError("Could not read that file. Try pasting its text.");
    }
  }
  function resultText() {
    return (result || [])
      .map(
        (line) =>
          `${line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "} ${line.text}`,
      )
      .join("\n");
  }
  async function copyResult() {
    try {
      await navigator.clipboard.writeText(resultText());
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("Clipboard unavailable. Use Download result instead.");
    }
  }
  function download() {
    if (!result) return;
    const text = resultText();
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "text-comparison.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const added = result?.filter((l) => l.kind === "added").length || 0,
    removed = result?.filter((l) => l.kind === "removed").length || 0;
  return (
    <>
      <div className="workspace-bar">
        <span>
          <span className="workspace-icon" aria-hidden="true">
            ±
          </span>{" "}
          Compare workspace
        </span>
        <span className="workspace-private">Private by design</span>
      </div>
      <div className="compare-inputs">
        {(["before", "after"] as const).map((side) => (
          <section className="text-panel" key={side}>
            <div className="panel-top">
              <label htmlFor={side}>
                <span
                  className={`input-marker ${side}`}
                  aria-hidden="true"
                ></span>
                {side === "before" ? "Original text" : "Updated text"}
              </label>
              <label className="file-button">
                Import file
                <input
                  type="file"
                  aria-label={`Import ${side === "before" ? "original" : "updated"} text file`}
                  accept=".txt,.md,.csv,.json,.html,.css,.js,.ts,.py,.xml,.yml,.yaml,.log,text/*"
                  onChange={(e) => {
                    void load(e.target.files?.[0], side);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <textarea
              id={side}
              spellCheck={false}
              maxLength={200000}
              placeholder={
                side === "before"
                  ? "Paste the original here…"
                  : "Paste the revised version here…"
              }
              value={side === "before" ? before : after}
              onChange={(e) => {
                reset();
                (side === "before" ? setBefore : setAfter)(e.target.value);
              }}
            />
            <div className="text-count">
              <span>
                {(side === "before" ? before : after) === ""
                  ? "Paste text or import a file"
                  : lineLabel(side === "before" ? before : after)}
              </span>
              <span>
                {(side === "before" ? before : after).length.toLocaleString()}{" "}
                characters
              </span>
            </div>
          </section>
        ))}
      </div>
      <div
        className="compare-controls"
        role="group"
        aria-label="Comparison controls"
      >
        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => {
                reset();
                setIgnoreCase(e.target.checked);
              }}
            />
            Ignore case
          </label>
          <label>
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => {
                reset();
                setIgnoreWhitespace(e.target.checked);
              }}
            />
            Ignore whitespace
          </label>
          <label>
            <input
              type="checkbox"
              checked={diffWords}
              onChange={(e) => {
                reset();
                setDiffWords(e.target.checked);
              }}
            />
            Highlight words
          </label>
          <label>
            <input
              type="checkbox"
              checked={exposeWhitespace}
              onChange={(e) => {
                setExposeWhitespace(e.target.checked);
              }}
            />
            Expose whitespace
          </label>
        </div>
        <div className="actions">
          <button
            onClick={() => {
              reset();
              setBefore(after);
              setAfter(before);
            }}
          >
            Swap
          </button>
          <button
            onClick={() => {
              reset();
              setBefore("");
              setAfter("");
            }}
          >
            Clear
          </button>
          <button
            className="primary"
            onClick={compare}
            disabled={!before && !after}
          >
            Compare texts
          </button>
        </div>
      </div>
      <p className="tool-note">
        Your text stays in this tab. No uploads or saved copies. Up to 200,000
        characters and 1,400 lines per side.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result !== null ? (
        <section className="diff-result" aria-labelledby="result-title">
          <div className="result-heading">
            <div>
              <h2 id="result-title">
                {added === 0 && removed === 0
                  ? "No differences found"
                  : "Here’s what changed"}
              </h2>
              <p role="status">
                {added} added · {removed} removed
                {ignoreCase || ignoreWhitespace
                  ? " · Selected ignore options applied"
                  : ""}
              </p>
            </div>
            <div className="actions result-actions">
              <label>
                <input
                  type="checkbox"
                  checked={changesOnly}
                  onChange={(e) => setChangesOnly(e.target.checked)}
                />
                Changes only
              </label>
              <button onClick={copyResult}>
                {copied ? "Copied!" : "Copy result"}
              </button>
              <button onClick={download}>Download result</button>
            </div>
          </div>
          {copyError && (
            <p className="error" role="alert">
              {copyError}
            </p>
          )}
          <p className="sr-only" aria-live="polite">
            {copied ? "Comparison copied to clipboard." : ""}
          </p>
          <p className="diff-legend">
            + Added lines · − Removed lines · Unmarked lines are unchanged
          </p>
          <div className="diff-column-labels" aria-hidden="true">
            <span>Old</span>
            <span>New</span>
            <span>Change</span>
          </div>
          <div
            className="diff-lines"
            tabIndex={0}
            role="region"
            aria-label="Line by line comparison"
          >
            {result
              .filter((l) => !changesOnly || l.kind !== "same")
              .map((l, i) => (
                <div className={`diff-line ${l.kind}`} key={i}>
                  <span className="line-no">
                    <span className="sr-only">
                      {l.oldLine ? "Original line " : ""}
                    </span>
                    {l.oldLine || ""}
                  </span>
                  <span className="line-no">
                    <span className="sr-only">
                      {l.newLine ? "Updated line " : ""}
                    </span>
                    {l.newLine || ""}
                  </span>
                  <span className="line-sign">
                    {l.kind === "added"
                      ? "+"
                      : l.kind === "removed"
                        ? "−"
                        : " "}
                  </span>
                  <code>
                    {diffWords && l.words && l.words.length > 0
                      ? l.words.map((w, wi) => (
                          <span
                            key={wi}
                            style={{
                              background:
                                w.kind === "added"
                                  ? "rgba(34, 197, 94, 0.28)"
                                  : w.kind === "removed"
                                    ? "rgba(239, 68, 68, 0.28)"
                                    : "transparent",
                              borderRadius: "2px",
                              padding: "1px 2px",
                            }}
                          >
                            {exposeWhitespace
                              ? visualizeWhitespace(w.text)
                              : w.text}
                          </span>
                        ))
                      : exposeWhitespace
                        ? visualizeWhitespace(l.text || " ")
                        : l.text || " "}
                  </code>
                </div>
              ))}
            {changesOnly && !added && !removed && (
              <p className="no-changes">There are no changed lines to show.</p>
            )}
          </div>
        </section>
      ) : (
        <div className="compare-empty">
          <div className="empty-diff-art" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="empty-copy">
            <h2>A clear view of every change.</h2>
            <p>Paste two versions above, then compare.</p>
          </div>
          <button
            onClick={() => {
              reset();
              setBefore(
                "A small tool.\nOne purpose.\nBuilt for everyday work.",
              );
              setAfter(
                "A useful tool.\nOne purpose.\nBuilt for everyday work.\nFree to use.",
              );
            }}
          >
            Try an example
          </button>
        </div>
      )}
    </>
  );
}
