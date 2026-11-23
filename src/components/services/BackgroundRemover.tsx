import { useState, useRef, useEffect } from "react";
import { downloadFile, fileSize } from "./files";
import ToolIcon from "./ToolIcon";
import { removeBackground } from "./bg-tools";

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [originalBitmap, setOriginalBitmap] = useState<ImageBitmap | null>(
    null,
  );
  const [tolerance, setTolerance] = useState<number>(25);
  const [feather, setFeather] = useState<number>(2);
  const [floodFillOnly, setFloodFillOnly] = useState<boolean>(true);
  const [targetColor, setTargetColor] = useState<
    [number, number, number] | null
  >(null);

  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const revision = useRef(0);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const pasted = item.getAsFile();
          if (pasted) {
            void handleFileSelect(pasted);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(
    () => () => {
      originalBitmap?.close();
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    },
    [originalBitmap, outputUrl],
  );

  function reset() {
    revision.current++;
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputBlob(null);
    setOutputUrl("");
    setError("");
    setMessage("");
  }

  async function handleFileSelect(selected: File | undefined) {
    if (!selected) return;
    reset();
    setFile(null);
    setOriginalBitmap(null);
    setTargetColor(null);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (
      !allowed.includes(selected.type) &&
      !selected.name.match(/\.(jpe?g|png|webp)$/i)
    ) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setError("Please choose an image smaller than 25 MB.");
      return;
    }

    setBusy(true);
    try {
      const bitmap = await createImageBitmap(selected);
      if (bitmap.width * bitmap.height > 25000000) {
        bitmap.close();
        throw new Error("Image exceeds 25 million pixels limit.");
      }
      setOriginalBitmap(bitmap);
      setFile(selected);
      setMessage(
        `Loaded ${selected.name} (${bitmap.width} × ${bitmap.height}). Ready to remove background.`,
      );
    } catch (e) {
      setError((e as Error).message || "Could not read this image.");
    } finally {
      setBusy(false);
    }
  }

  // Draw original image on canvas when bitmap changes
  useEffect(() => {
    if (originalBitmap && originalCanvasRef.current) {
      const canvas = originalCanvasRef.current;
      canvas.width = originalBitmap.width;
      canvas.height = originalBitmap.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(originalBitmap, 0, 0);
    }
  }, [originalBitmap]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setTargetColor([pixel[0], pixel[1], pixel[2]]);
    setMessage(
      `Sampled background color rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]}).`,
    );
  }

  async function processBackgroundRemoval() {
    if (!originalBitmap || !originalCanvasRef.current) return;
    reset();
    setBusy(true);
    const currentRev = revision.current;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = originalBitmap.width;
      canvas.height = originalBitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context is unavailable.");

      ctx.drawImage(originalBitmap, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Perform alpha matting
      const processed = removeBackground(imgData, {
        targetColor: targetColor || undefined,
        tolerance,
        feather,
        floodFillOnly,
      });

      if (currentRev !== revision.current) return;
      ctx.putImageData(processed, 0, 0);

      // Draw onto visible output canvas
      if (outputCanvasRef.current) {
        outputCanvasRef.current.width = canvas.width;
        outputCanvasRef.current.height = canvas.height;
        outputCanvasRef.current.getContext("2d")?.putImageData(processed, 0, 0);
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Encoding failed."))),
          "image/png",
        );
      });

      if (currentRev !== revision.current) return;
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
      setMessage(
        `Background removed successfully. Authentic transparent PNG ready (${fileSize(blob.size)}).`,
      );
    } catch (e) {
      if (currentRev === revision.current) {
        setError((e as Error).message);
      }
    } finally {
      if (currentRev === revision.current) {
        setBusy(false);
      }
    }
  }

  return (
    <>
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
            if (candidate) void handleFileSelect(candidate);
          }}
        >
          <ToolIcon name="drop" />
          <h2>{file ? file.name : "Drop an image here"}</h2>
          <p>
            {file
              ? "Tip: click the background in the preview to pick its color."
              : "Or paste one with Ctrl+V. Works best on plain backgrounds."}
          </p>
          <label className="upload-button">
            {file ? "Choose another image" : "Choose image"}
            <input
              type="file"
              aria-label="Choose image to remove background"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                handleFileSelect(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <small>Up to 25 MB · JPG, PNG or WebP</small>
        </div>

        {file && (
          <div className="settings-strip">
            <label className="quality-control">
              Tolerance <span>{tolerance}%</span>
              <input
                type="range"
                min="5"
                max="80"
                value={tolerance}
                disabled={busy}
                onChange={(e) => setTolerance(Number(e.target.value))}
              />
            </label>
            <label className="quality-control">
              Edge softness <span>{feather}px</span>
              <input
                type="range"
                min="0"
                max="10"
                value={feather}
                disabled={busy}
                onChange={(e) => setFeather(Number(e.target.value))}
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={floodFillOnly}
                disabled={busy}
                onChange={(e) => setFloodFillOnly(e.target.checked)}
              />
              Borders only
            </label>

            {targetColor ? (
              <button
                type="button"
                onClick={() => setTargetColor(null)}
                title="Reset to automatic corner sampling"
              >
                Reset color
              </button>
            ) : null}

            <button
              className="primary"
              disabled={busy || !originalBitmap}
              onClick={processBackgroundRemoval}
            >
              {busy ? "Processing…" : "Remove background"}
            </button>
          </div>
        )}
      </div>

      <div className="tool-result-bar">
        <p role="status">
          {message ||
            (busy
              ? "Processing image locally…"
              : "Choose an image to get started.")}
        </p>
        {outputBlob && (
          <button
            className="primary"
            onClick={() =>
              downloadFile(
                outputBlob,
                `${file?.name.replace(/\.[^.]+$/, "") || "image"}-transparent.png`,
              )
            }
          >
            Download transparent PNG
          </button>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {file && (
        <div className="image-previews">
          <section className="preview-panel">
            <div>
              <h2>Original</h2>
              <p>{fileSize(file.size)} · click to pick the background color</p>
            </div>
            <div className="canvas-stage">
              <canvas
                ref={originalCanvasRef}
                className="pickable"
                onClick={handleCanvasClick}
                title="Click to use this color as the background"
              />
            </div>
          </section>

          <section className="preview-panel">
            <div>
              <h2>Transparent result</h2>
              <p role="status">
                {outputBlob
                  ? `Export ready · ${fileSize(outputBlob.size)}`
                  : "Your transparent PNG will appear here"}
              </p>
            </div>
            <div className="canvas-stage">
              <canvas ref={outputCanvasRef} hidden={!outputBlob} />
              {!outputBlob && <span>Press “Remove background”</span>}
            </div>
          </section>
        </div>
      )}

      <p className="tool-note">
        Works best when the background is one even color. The result is a real
        PNG with transparency.
      </p>
    </>
  );
}
