import { useState, useRef } from "react";
import {
  cleanText,
  defaultCleanOptions,
  formatJson,
  type CleanOptions,
} from "./text-tools";
import { downloadFile } from "./files";
export default function TextTools({ mode }: { mode: "clean" | "json" }) {
  const json = mode === "json";
  const [input, setInput] = useState(""),
    [output, setOutput] = useState<string | null>(null),
    [options, setOptions] = useState(defaultCleanOptions),
    [indent, setIndent] = useState<"2" | "4" | "tab" | "minify">("2"),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const revision = useRef(0);
  function reset() {
    revision.current++;
    setOutput(null);
    setError("");
    setMessage("");
  }
  function process() {
    try {
      setOutput(json ? formatJson(input, indent) : cleanText(input, options));
      setMessage(
        json ? "Valid JSON. Result ready." : "Text cleaned. Result ready.",
      );
      setError("");
    } catch (e) {
      setOutput(null);
      setError(
        json
          ? `Invalid JSON or unsupported size: ${(e as Error).message.slice(0, 220)}`
          : (e as Error).message,
      );
      setMessage("");
    }
  }
  async function load(file: File | undefined) {
    if (!file) return;
    reset();
    const version = revision.current;
    if (file.size > 1000000) {
      setError("Choose a plain text file smaller than 1 MB.");
      return;
    }
    try {
      const text = await file.text();
      if (version !== revision.current) return;
      if (text.includes("\0"))
        throw new Error("Choose a plain text file, not a binary file.");
      setInput(text);
    } catch (e) {
      if (version === revision.current)
        setError((e as Error).message || "Could not read that file.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(output || "");
      setMessage("Result copied to clipboard.");
    } catch {
      setError("Clipboard unavailable. Use Download result instead.");
    }
  }
  const labels: Record<keyof CleanOptions, string> = {
    trimLines: "Trim each line",
    collapseSpaces: "Collapse extra spaces",
    removeEmptyLines: "Remove empty lines",
    joinWrappedLines: "Join wrapped lines",
  };
  return (
    <>
      <div className="workspace-bar">
        <span>{json ? "JSON workspace" : "Text workspace"}</span>
        <span className="workspace-private">Processed on your device</span>
      </div>
      <div className="compare-inputs">
        <section className="text-panel">
          <div className="panel-top">
            <label htmlFor="source-text">
              {json ? "JSON input" : "Original text"}
            </label>
            <label className="file-button">
              Import file
              <input
                aria-label="Import text file"
                type="file"
                accept={
                  json
                    ? ".json,application/json,text/plain"
                    : ".txt,.md,.csv,text/*"
                }
                onChange={(e) => {
                  void load(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <textarea
            id="source-text"
            value={input}
            maxLength={1000000}
            spellCheck={false}
            placeholder={
              json
                ? "Paste your JSON here…"
                : "Paste the text you want to clean…"
            }
            onChange={(e) => {
              reset();
              setInput(e.target.value);
            }}
          />
          <div className="text-count">
            {input.length.toLocaleString()} characters
          </div>
        </section>
        <section className="text-panel">
          <div className="panel-top">
            <label htmlFor="result-text">
              {json ? "Formatted JSON" : "Cleaned text"}
            </label>
            <span className="secondary-label">
              {output === null ? "Waiting for input" : "Ready to use"}
            </span>
          </div>
          <textarea
            id="result-text"
            readOnly
            value={output ?? ""}
            placeholder="Your result will appear here."
            spellCheck={false}
          />
          <div className="text-count">
            {output === null
              ? ""
              : `${output.length.toLocaleString()} characters`}
          </div>
        </section>
      </div>
      <div className="compare-controls">
        <div className="options">
          {json ? (
            <label className="select-label">
              Output style{" "}
              <select
                value={indent}
                onChange={(e) => {
                  reset();
                  setIndent(e.target.value as typeof indent);
                }}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tabs</option>
                <option value="minify">Minify</option>
              </select>
            </label>
          ) : (
            Object.keys(labels).map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={options[key as keyof CleanOptions]}
                  onChange={(e) => {
                    reset();
                    setOptions({ ...options, [key]: e.target.checked });
                  }}
                />
                {labels[key as keyof CleanOptions]}
              </label>
            ))
          )}
        </div>
        <div className="actions">
          <button
            onClick={() => {
              reset();
              setInput("");
            }}
          >
            Clear
          </button>
          <button className="primary" disabled={!input} onClick={process}>
            {json ? "Format JSON" : "Clean text"}
          </button>
        </div>
      </div>
      <div className="tool-result-bar">
        <p role="status">{message}</p>
        <div className="actions">
          <button disabled={output === null} onClick={copy}>
            Copy result
          </button>
          <button
            disabled={output === null}
            onClick={() =>
              downloadFile(
                new Blob([output || ""], {
                  type: json
                    ? "application/json;charset=utf-8"
                    : "text/plain;charset=utf-8",
                }),
                json ? "formatted.json" : "cleaned-text.txt",
              )
            }
          >
            Download result
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="tool-note">
        {json
          ? "Formatting preserves number spelling and precision. Up to 1 MB and 100 nesting levels."
          : "Up to 1 MB of plain text. “Join wrapped lines” keeps paragraphs separated by blank lines."}{" "}
        Your input stays in this tab.
      </p>
      {output === null && !input && (
        <div className="compare-empty">
          <div className="empty-copy">
            <h2>
              {json
                ? "Readable JSON, without changing the data."
                : "A little less cleanup in your day."}
            </h2>
            <p>
              {json
                ? "Validate first. Format or minify. Copy the result."
                : "Choose exactly which spacing changes to make."}
            </p>
          </div>
          <button
            onClick={() => {
              reset();
              setInput(
                json
                  ? '{"name":"Anwar","tools":["small","useful"],"count":9007199254740993}'
                  : "  A little   extra space.  \n\n  A cleaner second line.  ",
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
