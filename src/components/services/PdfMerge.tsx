import { useEffect, useRef, useState } from "react";
import { fileSize, downloadFile } from "./files";
import ToolIcon from "./ToolIcon";

type Entry = {
  id: number;
  name: string;
  size: number;
  pages: number;
  bytes: ArrayBuffer;
};

type PdfMode = "merge" | "split" | "compress";

export default function PdfMerge() {
  const [mode, setMode] = useState<PdfMode>("merge");

  // Merge state
  const [files, setFiles] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Blob | null>(null);

  // Split state
  const [splitFile, setSplitFile] = useState<Entry | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [splitResult, setSplitResult] = useState<Blob | null>(null);

  // Compress state
  const [compressFile, setCompressFile] = useState<Entry | null>(null);
  const [compressResult, setCompressResult] = useState<Blob | null>(null);
  const [compressionSavings, setCompressionSavings] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const nextId = useRef(0);
  const revision = useRef(0);

  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );

  function reset() {
    revision.current++;
    setResult(null);
    setSplitResult(null);
    setCompressResult(null);
    setCompressionSavings("");
    setError("");
    setMessage("");
  }

  // --- MERGE ACTIONS ---
  async function add(selected: FileList | null) {
    if (!selected?.length) return;
    reset();
    const request = revision.current;
    const candidates = Array.from(selected);
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

  // --- SPLIT ACTIONS ---
  async function loadSplitFile(file: File | undefined) {
    if (!file) return;
    reset();
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setBusy(true);
    try {
      const { inspectPdf } = await import("./pdf-tools");
      const bytes = await file.arrayBuffer();
      const doc = await inspectPdf(bytes);
      const totalPages = doc.getPageCount();
      setSplitFile({
        id: nextId.current++,
        name: file.name,
        size: file.size,
        pages: totalPages,
        bytes,
      });
      setPageRange(`1-${Math.min(totalPages, 5)}`);
      setMessage(`Loaded ${file.name} (${totalPages} pages).`);
    } catch (e) {
      setError((e as Error).message || "Could not read this PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSplit() {
    if (!splitFile) return;
    reset();
    setBusy(true);
    try {
      const { parsePageRanges, splitPdf } = await import("./pdf-tools");
      const indices = parsePageRanges(pageRange, splitFile.pages);
      const bytes = await splitPdf(splitFile.bytes, indices);
      setSplitResult(
        new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      );
      setMessage(`Extracted ${indices.length} pages. Ready to download.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // --- COMPRESS ACTIONS ---
  async function loadCompressFile(file: File | undefined) {
    if (!file) return;
    reset();
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setBusy(true);
    try {
      const { inspectPdf } = await import("./pdf-tools");
      const bytes = await file.arrayBuffer();
      const doc = await inspectPdf(bytes);
      setCompressFile({
        id: nextId.current++,
        name: file.name,
        size: file.size,
        pages: doc.getPageCount(),
        bytes,
      });
      setMessage(`Loaded ${file.name} (${fileSize(file.size)}).`);
    } catch (e) {
      setError((e as Error).message || "Could not read this PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCompress() {
    if (!compressFile) return;
    reset();
    setBusy(true);
    try {
      const { compressPdf } = await import("./pdf-tools");
      const outcome = await compressPdf(compressFile.bytes);
      setCompressResult(
        new Blob([new Uint8Array(outcome.bytes)], { type: "application/pdf" }),
      );
      if (outcome.savedBytes > 0) {
        const pct = Math.round(
          (outcome.savedBytes / outcome.originalSize) * 100,
        );
        setCompressionSavings(
          `Reduced by ${fileSize(outcome.savedBytes)} (${pct}% smaller).`,
        );
        setMessage(
          `Compressed from ${fileSize(outcome.originalSize)} to ${fileSize(outcome.newSize)}.`,
        );
      } else {
        setCompressionSavings(
          "Already optimized. Flate streams packed; size is unchanged or slightly larger.",
        );
        setMessage(
          `Original: ${fileSize(outcome.originalSize)} · Output: ${fileSize(outcome.newSize)}.`,
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="workspace-bar">
        <div className="tab-group" role="tablist" aria-label="PDF Tools">
          <button
            role="tab"
            aria-selected={mode === "merge"}
            className={mode === "merge" ? "tab active" : "tab"}
            onClick={() => {
              reset();
              setMode("merge");
            }}
          >
            Merge
          </button>
          <button
            role="tab"
            aria-selected={mode === "split"}
            className={mode === "split" ? "tab active" : "tab"}
            onClick={() => {
              reset();
              setMode("split");
            }}
          >
            Split
          </button>
          <button
            role="tab"
            aria-selected={mode === "compress"}
            className={mode === "compress" ? "tab active" : "tab"}
            onClick={() => {
              reset();
              setMode("compress");
            }}
          >
            Compress
          </button>
        </div>
      </div>

      {mode === "merge" && (
        <div className="file-workspace">
          <div
            className={`upload-zone ${isDragging ? "dragover" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const dt = e.dataTransfer.files;
              if (dt?.length) void add(dt);
            }}
          >
            <ToolIcon name="drop" />
            <h2>Drop PDFs here</h2>
            <p>Put them in order, then merge them into one.</p>
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
            <small>Up to 20 files, 50 MB in total</small>
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
              {files.length} files ·{" "}
              {files.reduce((sum, f) => sum + f.pages, 0)} pages
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
      )}

      {mode === "split" && (
        <div className="file-workspace">
          <div className="upload-zone">
            <ToolIcon name="drop" />
            <h2>{splitFile ? splitFile.name : "Pick pages from a PDF"}</h2>
            <p>
              {splitFile
                ? `${splitFile.pages} pages. Choose the ones to keep.`
                : "Keep only the pages you need, in any order."}
            </p>
            <label className="upload-button">
              {splitFile ? "Choose another PDF" : "Choose PDF file"}
              <input
                type="file"
                aria-label="Choose PDF to split"
                accept=".pdf,application/pdf"
                disabled={busy}
                onChange={(e) => {
                  void loadSplitFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <small>Up to 500 pages</small>
          </div>

          {splitFile && (
            <div className="settings-strip">
              <label>
                Pages to extract
                <input
                  type="text"
                  aria-label="Pages to extract"
                  value={pageRange}
                  placeholder="e.g. 1, 3-5, 8"
                  disabled={busy}
                  onChange={(e) => {
                    reset();
                    setPageRange(e.target.value);
                  }}
                />
              </label>
              <div className="actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    reset();
                    setPageRange(`1-${splitFile.pages}`);
                  }}
                >
                  All pages
                </button>
                <button
                  className="primary"
                  disabled={busy || !pageRange.trim()}
                  onClick={handleSplit}
                >
                  {busy ? "Working…" : "Extract pages"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "compress" && (
        <div className="file-workspace">
          <div className="upload-zone">
            <ToolIcon name="drop" />
            <h2>{compressFile ? compressFile.name : "Shrink a PDF"}</h2>
            <p>
              {compressFile
                ? `${fileSize(compressFile.size)} · ${compressFile.pages} pages`
                : "Repack the file without touching how it looks."}
            </p>
            <label className="upload-button">
              {compressFile ? "Choose another PDF" : "Choose PDF file"}
              <input
                type="file"
                aria-label="Choose PDF to compress"
                accept=".pdf,application/pdf"
                disabled={busy}
                onChange={(e) => {
                  void loadCompressFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <small>Lossless · scanned PDFs may not get smaller</small>
          </div>

          {compressFile && (
            <div className="settings-strip">
              <p>Ready to shrink.</p>
              <button
                className="primary"
                disabled={busy}
                onClick={handleCompress}
              >
                {busy ? "Compressing…" : "Compress PDF"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="tool-result-bar">
        <p role="status">
          {message ||
            (busy ? "Processing PDF locally…" : "Choose a PDF to begin.")}
          {compressionSavings && ` · ${compressionSavings}`}
        </p>
        {mode === "merge" && result && (
          <button
            className="primary"
            onClick={() => downloadFile(result, "merged.pdf")}
          >
            Download merged PDF
          </button>
        )}
        {mode === "split" && splitResult && (
          <button
            className="primary"
            onClick={() =>
              downloadFile(
                splitResult,
                `${splitFile?.name.replace(/\.pdf$/i, "") || "document"}-extracted.pdf`,
              )
            }
          >
            Download extracted PDF
          </button>
        )}
        {mode === "compress" && compressResult && (
          <button
            className="primary"
            onClick={() =>
              downloadFile(
                compressResult,
                `${compressFile?.name.replace(/\.pdf$/i, "") || "document"}-compressed.pdf`,
              )
            }
          >
            Download compressed PDF
          </button>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <p className="tool-note">
        Pages keep the order you choose. Form fields are flattened, and
        bookmarks and digital signatures are not kept.
      </p>
    </>
  );
}
