import { useState, useRef, useEffect } from "react";
import { fileSize, downloadFile } from "./files";
import ToolIcon from "./ToolIcon";
import { convertImage, extractAudioToWav } from "./converter-tools";

type Mode = "image" | "media";

export default function FileConverter() {
  const [mode, setMode] = useState<Mode>("image");
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>("image/png");
  const [quality, setQuality] = useState<number>(90);
  const [busy, setBusy] = useState<boolean>(false);
  const [progress, setProgress] = useState<{
    percent: number;
    step: string;
  } | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const abortController = useRef<AbortController | null>(null);
  const revision = useRef(0);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (mode !== "image") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) {
            handleFileSelect(f);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [mode]);

  useEffect(
    () => () => {
      revision.current++;
      abortController.current?.abort();
    },
    [],
  );

  function reset() {
    revision.current++;
    abortController.current?.abort();
    setResult(null);
    setResultName("");
    setError("");
    setMessage("");
    setProgress(null);
  }

  function handleModeChange(nextMode: Mode) {
    reset();
    setFile(null);
    setMode(nextMode);
    if (nextMode === "image") {
      setTargetFormat("image/png");
    } else {
      setTargetFormat("audio/wav");
    }
  }

  function handleFileSelect(selected: File | undefined) {
    if (!selected) return;
    reset();
    if (mode === "image") {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ];
      if (
        !allowed.includes(selected.type) &&
        !selected.name.match(/\.(jpe?g|png|webp|svg|heic)$/i)
      ) {
        setError("Choose a JPG, PNG, WebP, or SVG image.");
        return;
      }
      if (selected.size > 25 * 1024 * 1024) {
        setError("Choose an image smaller than 25 MB.");
        return;
      }
      // Suggest opposite or alternate format
      if (selected.type === "image/png") setTargetFormat("image/webp");
      else if (selected.type === "image/webp") setTargetFormat("image/png");
      else if (
        selected.type === "image/svg+xml" ||
        selected.name.endsWith(".svg")
      )
        setTargetFormat("image/png");
      else setTargetFormat("image/png");
    } else {
      if (selected.size > 50 * 1024 * 1024) {
        setError("Choose a media file smaller than 50 MB.");
        return;
      }
    }
    setFile(selected);
    setMessage(
      `Ready to convert ${selected.name} (${fileSize(selected.size)}).`,
    );
  }

  async function convert() {
    if (!file) return;
    reset();
    setBusy(true);
    abortController.current = new AbortController();
    const currentRev = revision.current;

    try {
      if (mode === "image") {
        setProgress({ percent: 30, step: "Decoding image…" });
        const blob = await convertImage(
          file,
          targetFormat as "image/jpeg" | "image/png" | "image/webp",
          quality / 100,
        );
        if (currentRev !== revision.current) return;
        const ext =
          targetFormat === "image/webp"
            ? "webp"
            : targetFormat === "image/jpeg"
              ? "jpg"
              : "png";
        const base = file.name.replace(/\.[^.]+$/, "");
        setResult(blob);
        setResultName(`${base}.${ext}`);
        setMessage(
          `Converted to ${ext.toUpperCase()} (${fileSize(blob.size)}).`,
        );
      } else {
        const blob = await extractAudioToWav(
          file,
          (percent, step) => setProgress({ percent, step }),
          abortController.current.signal,
        );
        if (currentRev !== revision.current) return;
        const base = file.name.replace(/\.[^.]+$/, "");
        setResult(blob);
        setResultName(`${base}.wav`);
        setMessage(`Extracted audio to WAV (${fileSize(blob.size)}).`);
      }
    } catch (e) {
      if (currentRev === revision.current) {
        setError((e as Error).message);
      }
    } finally {
      if (currentRev === revision.current) {
        setBusy(false);
        setProgress(null);
      }
    }
  }

  function cancel() {
    abortController.current?.abort();
    reset();
    setBusy(false);
    setMessage("Conversion cancelled.");
  }

  return (
    <>
      <div className="workspace-bar">
        <div className="tab-group" role="tablist" aria-label="Converter modes">
          <button
            role="tab"
            aria-selected={mode === "image"}
            className={mode === "image" ? "tab active" : "tab"}
            onClick={() => handleModeChange("image")}
          >
            Images
          </button>
          <button
            role="tab"
            aria-selected={mode === "media"}
            className={mode === "media" ? "tab active" : "tab"}
            onClick={() => handleModeChange("media")}
          >
            Video to audio
          </button>
        </div>
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
            if (candidate) handleFileSelect(candidate);
          }}
        >
          <ToolIcon name="drop" />
          <h2>
            {file
              ? file.name
              : mode === "image"
                ? "Drop an image here"
                : "Drop a video here"}
          </h2>
          <p>
            {file
              ? fileSize(file.size)
              : mode === "image"
                ? "Or paste one with Ctrl+V. JPG, PNG, WebP or SVG."
                : "You get its sound as a WAV file."}
          </p>
          <label className="upload-button">
            {file ? "Choose another file" : "Choose file"}
            <input
              type="file"
              aria-label={
                mode === "image" ? "Choose image file" : "Choose media file"
              }
              accept={
                mode === "image"
                  ? "image/jpeg,image/png,image/webp,image/svg+xml,.svg"
                  : "video/*,audio/*,.mp4,.mov,.webm,.ogg,.mkv"
              }
              disabled={busy}
              onChange={(e) => {
                handleFileSelect(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <small>{mode === "image" ? "Up to 25 MB" : "Up to 50 MB"}</small>
        </div>

        {file && (
          <div className="settings-strip">
            {mode === "image" ? (
              <>
                <label>
                  Convert to
                  <select
                    value={targetFormat}
                    disabled={busy}
                    onChange={(e) => {
                      reset();
                      setTargetFormat(e.target.value);
                    }}
                  >
                    <option value="image/png">PNG (Lossless, Alpha)</option>
                    <option value="image/webp">WebP (Modern, Compact)</option>
                    <option value="image/jpeg">JPEG (Universal)</option>
                  </select>
                </label>
                {targetFormat !== "image/png" && (
                  <label className="quality-control">
                    Quality <span>{quality}%</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={quality}
                      disabled={busy}
                      onChange={(e) => {
                        reset();
                        setQuality(Number(e.target.value));
                      }}
                    />
                  </label>
                )}
              </>
            ) : (
              <label>
                Output format
                <select value="audio/wav" disabled>
                  <option value="audio/wav">WAV (16-bit PCM Audio)</option>
                </select>
              </label>
            )}

            <div className="actions">
              {busy ? (
                <button type="button" onClick={cancel}>
                  Cancel
                </button>
              ) : (
                <button className="primary" onClick={convert}>
                  Convert file
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {progress && (
        <div className="progress">
          <p>
            {progress.step} ({progress.percent}%)
          </p>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="tool-result-bar">
        <p role="status">
          {message ||
            (busy ? "Processing file locally…" : "Choose a file to convert.")}
        </p>
        {result && (
          <button
            className="primary"
            onClick={() => downloadFile(result, resultName)}
          >
            Download {resultName}
          </button>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <p className="tool-note">
        Files are really decoded and re-encoded, not just renamed, and they
        never leave your device.
      </p>
    </>
  );
}
