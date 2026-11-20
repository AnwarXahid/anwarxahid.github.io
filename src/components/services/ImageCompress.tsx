import { useEffect, useRef, useState } from "react";
import { downloadFile, fileSize } from "./files";
function useBlobUrl(blob: Blob | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const value = URL.createObjectURL(blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [blob]);
  return url;
}
export default function ImageCompress() {
  const [file, setFile] = useState<File | null>(null),
    [bitmap, setBitmap] = useState<ImageBitmap | null>(null),
    [output, setOutput] = useState<Blob | null>(null),
    [dimensions, setDimensions] = useState(""),
    [quality, setQuality] = useState(80),
    [edge, setEdge] = useState(1920),
    [format, setFormat] = useState("image/jpeg"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const revision = useRef(0);
  const originalUrl = useBlobUrl(file),
    resultUrl = useBlobUrl(output);
  useEffect(() => () => bitmap?.close(), [bitmap]);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  function invalidate() {
    revision.current++;
    setOutput(null);
    setDimensions("");
    setError("");
  }
  async function load(candidate: File | undefined) {
    if (!candidate) return;
    invalidate();
    setFile(null);
    setBitmap(null);
    const request = revision.current;
    if (!["image/jpeg", "image/png", "image/webp"].includes(candidate.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (candidate.size > 25 * 1024 * 1024) {
      setError("Choose an image smaller than 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const decoded = await createImageBitmap(candidate);
      if (request !== revision.current) {
        decoded.close();
        return;
      }
      if (decoded.width * decoded.height > 25000000) {
        decoded.close();
        throw new Error("Choose an image with no more than 25 million pixels.");
      }
      setBitmap(decoded);
      setFile(candidate);
    } catch (e) {
      if (request === revision.current)
        setError(
          (e as Error).message.includes("pixels")
            ? (e as Error).message
            : "Could not read that image. Try another JPG, PNG, or WebP.",
        );
    } finally {
      if (request === revision.current) setBusy(false);
    }
  }
  async function compress() {
    if (!bitmap) return;
    setBusy(true);
    setError("");
    setOutput(null);
    const request = ++revision.current;
    try {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx)
        throw new Error("Image processing is unavailable in this browser.");
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(
                  new Error("Could not encode the image. Try a smaller image."),
                ),
          format,
          quality / 100,
        ),
      );
      if (blob.type !== format)
        throw new Error(
          "This output format is unavailable in your browser. Try JPEG.",
        );
      if (request !== revision.current) return;
      setOutput(blob);
      setDimensions(`${canvas.width} × ${canvas.height}`);
      canvas.width = 0;
      canvas.height = 0;
    } catch (e) {
      if (request === revision.current) setError((e as Error).message);
    } finally {
      if (request === revision.current) setBusy(false);
    }
  }
  const saving =
    output && file ? Math.round((1 - output.size / file.size) * 100) : 0;
  return (
    <>
      <div className="file-workspace">
        <div className="upload-zone">
          <span className="upload-symbol" aria-hidden="true">
            ▧
          </span>
          <h2>{file ? file.name : "Make a little space."}</h2>
          <p>
            {file
              ? "Choose your settings, then compress."
              : "Choose a JPG, PNG, or WebP. Your image stays on this device."}
          </p>
          <label className="upload-button">
            {file ? "Choose another image" : "Choose an image"}
            <input
              type="file"
              aria-label="Choose image"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                void load(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <small>Up to 25 MB · 25 million pixels</small>
        </div>
        <div className="settings-strip">
          <label>
            Output format
            <select
              value={format}
              disabled={busy}
              onChange={(e) => {
                invalidate();
                setFormat(e.target.value);
              }}
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
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
                invalidate();
                setQuality(Number(e.target.value));
              }}
            />
          </label>
          <label>
            Longest edge
            <select
              value={edge}
              disabled={busy}
              onChange={(e) => {
                invalidate();
                setEdge(Number(e.target.value));
              }}
            >
              <option value="960">Up to 960 px</option>
              <option value="1920">Up to 1920 px</option>
              <option value="2560">Up to 2560 px</option>
              <option value="8192">Up to 8192 px</option>
            </select>
          </label>
          <button
            className="primary"
            disabled={!bitmap || busy}
            onClick={compress}
          >
            {busy ? "Working…" : "Compress image"}
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="tool-note">
        JPEG places transparent areas on white. WebP keeps transparency. Exports
        a still image without the original metadata or animation.
      </p>
      {file && bitmap && (
        <div className="image-previews">
          <section className="preview-panel">
            <div>
              <h2>Original</h2>
              <p>
                {fileSize(file.size)} · {bitmap.width} × {bitmap.height}
              </p>
            </div>
            {originalUrl && (
              <img src={originalUrl} alt="Original image preview" />
            )}
          </section>
          <section className="preview-panel">
            <div>
              <h2>Compressed</h2>
              <p role="status">
                {output
                  ? `${fileSize(output.size)} · ${dimensions} · ${output.size < file.size ? (saving === 0 ? "Less than 1% smaller" : `${Math.min(saving, 99)}% smaller`) : output.size === file.size ? "Same size" : "Not smaller—try lower quality"}`
                  : "Your compressed image will appear here."}
              </p>
            </div>
            {resultUrl ? (
              <img src={resultUrl} alt="Compressed image preview" />
            ) : (
              <div className="preview-placeholder" aria-hidden="true">
                ▧
              </div>
            )}
            {output && (
              <button
                className="primary"
                onClick={() =>
                  downloadFile(
                    output,
                    `${file.name.replace(/\.[^.]+$/, "")}-compressed.${output.type === "image/webp" ? "webp" : "jpg"}`,
                  )
                }
              >
                Download image
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}
