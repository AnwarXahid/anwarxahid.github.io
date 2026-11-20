import { useState, useRef, useEffect } from "react";
import {
  cleanText,
  defaultCleanOptions,
  formatJson,
  formatCsv,
  formatXml,
  convertCase,
  countTextStats,
  type CleanOptions,
  type TextCase,
} from "./text-tools";
import { downloadFile } from "./files";

export default function TextTools({ mode }: { mode: "clean" | "json" }) {
  const json = mode === "json";
  const [dataFormat, setDataFormat] = useState<"json" | "csv" | "xml">("json");
  const [csvTarget, setCsvTarget] = useState<"csv" | "tsv" | "json">("csv");

  const [input, setInput] = useState("");
  const [previousInput, setPreviousInput] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [options, setOptions] = useState(defaultCleanOptions);
  const [indent, setIndent] = useState<"2" | "4" | "tab" | "minify">("2");
  const [selectedCase, setSelectedCase] = useState<TextCase>("upper");
  const [saveLocally, setSaveLocally] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const revision = useRef(0);

  // Load opt-in draft for clean text scratchpad if enabled
  useEffect(() => {
    if (!json) {
      try {
        const savedPref = localStorage.getItem("scratchpad_save_enabled");
        if (savedPref === "true") {
          setSaveLocally(true);
          const draft = localStorage.getItem("scratchpad_draft");
          if (draft) setInput(draft);
        }
      } catch {}
    }
  }, [json]);

  function handleSavePreferenceChange(checked: boolean) {
    setSaveLocally(checked);
    try {
      if (checked) {
        localStorage.setItem("scratchpad_save_enabled", "true");
        localStorage.setItem("scratchpad_draft", input);
      } else {
        localStorage.removeItem("scratchpad_save_enabled");
        localStorage.removeItem("scratchpad_draft");
      }
    } catch {}
  }

  function handleInputChange(value: string) {
    reset();
    setInput(value);
    if (!json && saveLocally) {
      try {
        localStorage.setItem("scratchpad_draft", value);
      } catch {}
    }
  }

  function reset() {
    revision.current++;
    setOutput(null);
    setError("");
    setMessage("");
  }

  function process() {
    try {
      if (!json) {
        setOutput(cleanText(input, options));
        setMessage("Text cleaned. Result ready.");
      } else if (dataFormat === "json") {
        setOutput(formatJson(input, indent));
        setMessage("Valid JSON. Result ready.");
      } else if (dataFormat === "csv") {
        setOutput(formatCsv(input, csvTarget));
        setMessage("CSV formatted and validated. Result ready.");
      } else {
        setOutput(formatXml(input, indent));
        setMessage("Valid XML. Result ready.");
      }
      setError("");
    } catch (e) {
      setOutput(null);
      setError(
        json
          ? `Invalid ${dataFormat.toUpperCase()} or unsupported size: ${(e as Error).message.slice(0, 220)}`
          : (e as Error).message,
      );
      setMessage("");
    }
  }

  function applyCaseConversion() {
    if (!input) return;
    setPreviousInput(input);
    const converted = convertCase(input, selectedCase);
    handleInputChange(converted);
    setMessage(
      `Converted text to ${selectedCase.toUpperCase()}. Destructive transformation applied.`,
    );
  }

  function undoCaseConversion() {
    if (previousInput !== null) {
      handleInputChange(previousInput);
      setPreviousInput(null);
      setMessage("Restored previous text.");
    }
  }

  async function load(file: File | undefined) {
    if (!file) return;
    reset();
    const version = revision.current;
    if (file.size > 2000000) {
      setError("Choose a plain text file smaller than 2 MB.");
      return;
    }
    try {
      const text = await file.text();
      if (version !== revision.current) return;
      if (text.includes("\0"))
        throw new Error("Choose a plain text file, not a binary file.");
      handleInputChange(text);
      if (json) {
        if (file.name.endsWith(".csv")) setDataFormat("csv");
        else if (file.name.endsWith(".xml")) setDataFormat("xml");
        else if (file.name.endsWith(".json")) setDataFormat("json");
      }
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

  const stats = countTextStats(input);
  const outStats = output !== null ? countTextStats(output) : null;

  return (
    <>
      <div className="workspace-bar">
        <span>{json ? "Data workspace" : "Scratchpad & Text workspace"}</span>
        {json && (
          <div className="tab-group" role="tablist" aria-label="Data format">
            <button
              role="tab"
              aria-selected={dataFormat === "json"}
              className={dataFormat === "json" ? "tab active" : "tab"}
              onClick={() => {
                reset();
                setDataFormat("json");
              }}
            >
              JSON
            </button>
            <button
              role="tab"
              aria-selected={dataFormat === "csv"}
              className={dataFormat === "csv" ? "tab active" : "tab"}
              onClick={() => {
                reset();
                setDataFormat("csv");
              }}
            >
              CSV
            </button>
            <button
              role="tab"
              aria-selected={dataFormat === "xml"}
              className={dataFormat === "xml" ? "tab active" : "tab"}
              onClick={() => {
                reset();
                setDataFormat("xml");
              }}
            >
              XML
            </button>
          </div>
        )}
        <span className="workspace-private">Processed on your device</span>
      </div>

      <div className="compare-inputs">
        <section className="text-panel">
          <div className="panel-top">
            <label htmlFor="source-text">
              {json
                ? dataFormat === "csv"
                  ? "CSV input"
                  : dataFormat === "xml"
                    ? "XML input"
                    : "JSON input"
                : "Original text"}
            </label>
            <label className="file-button">
              Import file
              <input
                aria-label="Import text file"
                type="file"
                accept={
                  json
                    ? ".json,.csv,.xml,.tsv,application/json,text/plain"
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
                ? dataFormat === "csv"
                  ? "Paste CSV data here (supports quotes and embedded newlines)…"
                  : dataFormat === "xml"
                    ? "Paste XML markup here…"
                    : "Paste your JSON here…"
                : "Paste the text you want to clean or draft here…"
            }
            onChange={(e) => handleInputChange(e.target.value)}
          />
          <div className="text-count">
            {!json
              ? `${stats.words.toLocaleString()} words · ${stats.chars.toLocaleString()} chars (${stats.charsNoSpaces.toLocaleString()} non-space) · ${stats.lines} lines · ${stats.paragraphs} paragraphs`
              : `${input.length.toLocaleString()} characters`}
          </div>
        </section>

        <section className="text-panel">
          <div className="panel-top">
            <label htmlFor="result-text">
              {json
                ? dataFormat === "csv"
                  ? "Formatted CSV"
                  : dataFormat === "xml"
                    ? "Formatted XML"
                    : "Formatted JSON"
                : "Cleaned text"}
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
              : !json && outStats
                ? `${outStats.words.toLocaleString()} words · ${outStats.chars.toLocaleString()} chars · ${outStats.lines} lines`
                : `${output.length.toLocaleString()} characters`}
          </div>
        </section>
      </div>

      <div className="compare-controls">
        <div className="options">
          {json ? (
            dataFormat === "csv" ? (
              <label className="select-label">
                CSV Target{" "}
                <select
                  value={csvTarget}
                  onChange={(e) => {
                    reset();
                    setCsvTarget(e.target.value as typeof csvTarget);
                  }}
                >
                  <option value="csv">Standard CSV (Quotes preserved)</option>
                  <option value="tsv">TSV (Tab-separated)</option>
                  <option value="json">Convert CSV to JSON</option>
                </select>
              </label>
            ) : (
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
            )
          ) : (
            <>
              {Object.keys(labels).map((key) => (
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
              ))}
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Case:
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value as TextCase)}
                >
                  <option value="upper">UPPERCASE</option>
                  <option value="lower">lowercase</option>
                  <option value="title">Title Case</option>
                  <option value="sentence">Sentence case</option>
                  <option value="camel">camelCase</option>
                  <option value="snake">snake_case</option>
                  <option value="kebab">kebab-case</option>
                </select>
                <button
                  type="button"
                  disabled={!input}
                  onClick={applyCaseConversion}
                >
                  Apply Case
                </button>
                {previousInput !== null && (
                  <button type="button" onClick={undoCaseConversion}>
                    Undo
                  </button>
                )}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={saveLocally}
                  onChange={(e) => handleSavePreferenceChange(e.target.checked)}
                />
                Save draft locally
              </label>
            </>
          )}
        </div>

        <div className="actions">
          <button
            onClick={() => {
              reset();
              handleInputChange("");
            }}
          >
            Clear
          </button>
          <button className="primary" disabled={!input} onClick={process}>
            {json
              ? dataFormat === "csv"
                ? "Format CSV"
                : dataFormat === "xml"
                  ? "Format XML"
                  : "Format JSON"
              : "Clean text"}
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
                    ? dataFormat === "csv"
                      ? csvTarget === "json"
                        ? "application/json;charset=utf-8"
                        : "text/csv;charset=utf-8"
                      : dataFormat === "xml"
                        ? "application/xml;charset=utf-8"
                        : "application/json;charset=utf-8"
                    : "text/plain;charset=utf-8",
                }),
                json
                  ? dataFormat === "csv"
                    ? csvTarget === "json"
                      ? "converted.json"
                      : "formatted.csv"
                    : dataFormat === "xml"
                      ? "formatted.xml"
                      : "formatted.json"
                  : "cleaned-text.txt",
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
          ? "Preserves numeric precision for large integers. CSV parsing handles quotes and embedded newlines. XML external entities are disabled for security."
          : "Zero automatic cloud or local persistence by default; drafts are only stored in this browser if explicitly enabled above."}{" "}
        Your input stays on this device.
      </p>

      {output === null && !input && (
        <div className="compare-empty">
          <div className="empty-copy">
            <h2>
              {json
                ? "Readable JSON, CSV, and XML without data loss."
                : "A little less cleanup in your day."}
            </h2>
            <p>
              {json
                ? "Validate, format, minify, or convert between formats safely."
                : "Choose whitespace options, convert letter casing, and inspect counts."}
            </p>
          </div>
          <button
            onClick={() => {
              reset();
              handleInputChange(
                json
                  ? dataFormat === "csv"
                    ? 'id,name,role\n1,"Zahid, Anwar",Developer\n2,"Researcher",Scientist'
                    : dataFormat === "xml"
                      ? "<note><to>Anwar</to><from>Lab</from><heading>Reminder</heading><body>Small tools done well</body></note>"
                      : '{"name":"Anwar","tools":["small","useful"],"count":9007199254740993}'
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
