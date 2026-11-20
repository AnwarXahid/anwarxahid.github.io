import { useState, useRef, useEffect } from "react";
import { downloadFile, fileSize } from "./files";

export default function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const workerRef = useRef<any>(null);
  const revision = useRef<number>(0);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            handleImageSelected(pastedFile);
            break;
          }
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (workerRef.current) {
        workerRef.current.terminate?.();
      }
    };
  }, [previewUrl]);

  function reset() {
    revision.current++;
    setExtractedText("");
    setError("");
    setMessage("");
    setProgress(null);
  }

  function handleImageSelected(selected: File | undefined) {
    if (!selected) return;
    reset();
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!selected.type.startsWith("image/")) {
      setError("Please choose or paste an image file (PNG, JPG, WebP).");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError("Please choose an image smaller than 20 MB.");
      return;
    }

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setFile(selected);
    setMessage(
      `Loaded image (${fileSize(selected.size)}). Click "Extract text" to run OCR.`,
    );
  }

  async function runOcr() {
    if (!file) return;
    reset();
    setBusy(true);
    setProgress(5);
    setMessage(
      "Initializing local OCR engine… Your image never leaves your device.",
    );
    const currentRev = revision.current;

    try {
      const { createWorker } = await import("tesseract.js");
      if (!workerRef.current) {
        workerRef.current = await createWorker("eng", 1, {
          workerPath: "/math/ocr/worker.min.js",
          corePath: "/math/ocr",
          langPath: "/math/ocr",
          workerBlobURL: false,
          logger: (status: any) => {
            if (typeof status.progress === "number") {
              setProgress(Math.round(status.progress * 100));
            }
          },
        });
      }

      if (currentRev !== revision.current) return;
      const result = await workerRef.current.recognize(file);
      if (currentRev !== revision.current) return;

      const text = result.data.text.trim();
      setExtractedText(text);
      if (text) {
        setMessage(`OCR complete. Extracted ${text.length} characters.`);
      } else {
        setMessage(
          "OCR completed, but no readable text was detected in the image.",
        );
      }
    } catch (e) {
      if (currentRev === revision.current) {
        setError(`OCR processing error: ${(e as Error).message}`);
      }
    } finally {
      if (currentRev === revision.current) {
        setBusy(false);
        setProgress(null);
      }
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(extractedText);
      setMessage("Extracted text copied to clipboard.");
    } catch {
      setError("Clipboard access denied. Use Download result instead.");
    }
  }

  return (
    <>
      <div className="workspace-bar">
        <span>OCR / Image to Text</span>
        <span className="workspace-private">Processed on your device</span>
      </div>

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
            const candidate = e.dataTransfer.files?.[0];
            if (candidate) handleImageSelected(candidate);
          }}
        >
          <span className="upload-symbol" aria-hidden="true">
            🖹
          </span>
          <h2>{file ? file.name : "Extract text from images & screenshots"}</h2>
          <p>
            {file
              ? "Image ready for text recognition. Processed with offline English OCR."
              : "Upload an image, drag & drop, or paste a screenshot directly (Ctrl+V)."}
          </p>
          <label className="upload-button">
            {file ? "Choose another image" : "Choose image"}
            <input
              type="file"
              aria-label="Choose image for OCR"
              accept="image/png,image/jpeg,image/webp,image/*"
              disabled={busy}
              onChange={(e) => {
                handleImageSelected(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <small>
            Up to 20 MB · Supports screenshot paste (Ctrl+V) · Language: English · 100% In-Browser
          </small>
        </div>

        {file && (
          <div className="settings-strip">
            <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
              Language: <strong>English (offline local model)</strong>
            </span>
            <button className="primary" disabled={busy} onClick={runOcr}>
              {busy ? "Recognizing text…" : "Extract text"}
            </button>
          </div>
        )}
      </div>

      {progress !== null && (
        <div
          style={{
            maxWidth: "600px",
            margin: "1rem auto",
            textAlign: "center",
          }}
        >
          <p>Analyzing characters… {progress}%</p>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "var(--border, #e2e8f0)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--accent, #0f766e)",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      )}

      <div className="tool-result-bar">
        <p role="status">
          {message ||
            (busy
              ? "Extracting text locally…"
              : "Upload or paste an image to begin.")}
        </p>
        <div className="actions">
          {extractedText && (
            <>
              <button onClick={copyText}>Copy text</button>
              <button
                className="primary"
                onClick={() =>
                  downloadFile(
                    new Blob([extractedText], {
                      type: "text/plain;charset=utf-8",
                    }),
                    `${file?.name.replace(/\.[^.]+$/, "") || "ocr"}-text.txt`,
                  )
                }
              >
                Download text
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {file && (
        <div className="compare-inputs" style={{ marginTop: "1.5rem" }}>
          <section className="text-panel">
            <div className="panel-top">
              <label>Source image preview</label>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface, #f8fafc)",
                border: "1px solid var(--line, #e2e8f0)",
                borderRadius: "6px",
                minHeight: "220px",
                padding: "8px",
              }}
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="OCR source preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "320px",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </section>

          <section className="text-panel">
            <div className="panel-top">
              <label htmlFor="ocr-result-text">Extracted text</label>
              <span className="secondary-label">
                {extractedText
                  ? `${extractedText.length} characters`
                  : "Awaiting extraction"}
              </span>
            </div>
            <textarea
              id="ocr-result-text"
              readOnly
              value={extractedText}
              placeholder="Extracted text will appear here. You can select, copy, or download it."
              style={{ minHeight: "220px" }}
              spellCheck={false}
            />
          </section>
        </div>
      )}

      <p className="tool-note">
        OCR uses Tesseract.js running in a local Web Worker with offline English
        weights hosted directly on this site. Images and screenshots are
        processed locally in your browser and never uploaded.
      </p>
    </>
  );
}
