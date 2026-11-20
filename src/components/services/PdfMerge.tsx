import { useEffect, useRef, useState } from "react";
import { fileSize, downloadFile } from "./files";
type Entry = {
  id: number;
  name: string;
  size: number;
  pages: number;
  bytes: ArrayBuffer;
};
export default function PdfMerge() {
  const [files, setFiles] = useState<Entry[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [result, setResult] = useState<Blob | null>(null);
  const nextId = useRef(0),
    revision = useRef(0);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  function reset() {
    revision.current++;
    setResult(null);
    setError("");
    setMessage("");
  }
  async function add(selected: FileList | null) {
    if (!selected?.length) return;
    reset();
    const request = revision.current,
      candidates = Array.from(selected);
    if (files.length + candidates.length > 20) {
      setError("Choose no more than 20 PDF files.");
      return;
    }
    if (
      files.reduce((sum, f) => sum + f.size, 0) +
        candidates.reduce((sum, f) => sum + f.size, 0) >
      50 * 1024 * 1024
    ) {
      setError("Keep the combined file size below 50 MB.");
      return;
    }
    setBusy(true);
    try {
      const { inspectPdf } = await import("./pdf-tools");
      const pending: Entry[] = [];
      for (const file of candidates) {
        if (!file.name.toLowerCase().endsWith(".pdf"))
          throw new Error(`${file.name}: choose a PDF file.`);
        try {
          const bytes = await file.arrayBuffer();
          const doc = await inspectPdf(bytes);
          pending.push({
            id: nextId.current++,
            name: file.name,
            size: file.size,
            pages: doc.getPageCount(),
            bytes,
          });
        } catch {
          throw new Error(
            `${file.name}: could not open this PDF. It may be damaged or password-protected.`,
          );
        }
      }
      if (request !== revision.current) return;
      if ([...files, ...pending].reduce((sum, f) => sum + f.pages, 0) > 500)
        throw new Error("Combine no more than 500 pages at once.");
      setFiles([...files, ...pending]);
      setMessage(
        `${pending.length} PDF ${pending.length === 1 ? "file" : "files"} added.`,
      );
    } catch (e) {
      if (request === revision.current) setError((e as Error).message);
    } finally {
      if (request === revision.current) setBusy(false);
    }
  }
  function move(index: number, step: number) {
    reset();
    const next = [...files];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    setFiles(next);
  }
  async function merge() {
    reset();
    const request = revision.current;
    setBusy(true);
    try {
      const { mergePdfs } = await import("./pdf-tools");
      const bytes = await mergePdfs(files.map((f) => f.bytes));
      if (request !== revision.current) return;
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
      setMessage(
        `Merged ${files.length} files · ${files.reduce((sum, f) => sum + f.pages, 0)} pages. Ready to download.`,
      );
    } catch (e) {
      if (request === revision.current)
        setError(
          `Could not merge these files. ${(e as Error).message.slice(0, 180)}`,
        );
    } finally {
      if (request === revision.current) setBusy(false);
    }
  }
  return (
    <>
      <div className="file-workspace">
        <div className="upload-zone">
          <span className="upload-symbol" aria-hidden="true">
            ▤
          </span>
          <h2>Separate files. One document.</h2>
          <p>Add your PDFs, arrange their order, then merge.</p>
          <label className="upload-button">
            {files.length ? "Add more PDFs" : "Choose PDF files"}
            <input
              type="file"
              aria-label="Choose PDF files"
              accept=".pdf,application/pdf"
              multiple
              disabled={busy}
              onChange={(e) => {
                void add(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <small>Up to 20 files · 50 MB combined · 500 pages</small>
        </div>
        {files.length > 0 && (
          <ol className="pdf-file-list">
            {files.map((file, index) => (
              <li key={file.id}>
                <span className="pdf-file-icon" aria-hidden="true">
                  PDF
                </span>
                <div className="pdf-file-info">
                  <strong>{file.name}</strong>
                  <small>
                    {file.pages} {file.pages === 1 ? "page" : "pages"} ·{" "}
                    {fileSize(file.size)}
                  </small>
                </div>
                <div className="actions">
                  <button
                    disabled={busy || index === 0}
                    aria-label={`Move ${file.name} earlier`}
                    onClick={() => move(index, -1)}
                  >
                    Earlier
                  </button>
                  <button
                    disabled={busy || index === files.length - 1}
                    aria-label={`Move ${file.name} later`}
                    onClick={() => move(index, 1)}
                  >
                    Later
                  </button>
                  <button
                    disabled={busy}
                    aria-label={`Remove ${file.name}`}
                    onClick={() => {
                      reset();
                      setFiles(files.filter((f) => f.id !== file.id));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="pdf-actions">
          <p>
            {files.length} files · {files.reduce((sum, f) => sum + f.pages, 0)}{" "}
            pages
          </p>
          <div className="actions">
            <button
              disabled={busy || files.length === 0}
              onClick={() => {
                reset();
                setFiles([]);
              }}
            >
              Clear all
            </button>
            <button
              className="primary"
              disabled={busy || files.length < 2}
              onClick={merge}
            >
              {busy ? "Working…" : "Merge PDFs"}
            </button>
          </div>
        </div>
      </div>
      <div className="tool-result-bar">
        <p role="status">
          {message ||
            (busy
              ? "Processing PDFs locally…"
              : "Choose at least two PDFs to get started.")}
        </p>
        {result && (
          <button
            className="primary"
            onClick={() => downloadFile(result, "merged.pdf")}
          >
            Download merged PDF
          </button>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="tool-note">
        Files stay on this device. Pages follow the file order shown above. Form
        values are flattened; interactive forms, bookmarks, and digital
        signatures are not preserved. Password-protected PDFs are not supported.
      </p>
    </>
  );
}
