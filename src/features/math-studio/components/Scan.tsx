import { useEffect, useRef, useState } from "react";

type Props = { onUse: (value: string) => void };
export default function Scan({ onUse }: Props) {
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const worker = useRef<any>(undefined);
  const pdfJob = useRef(0);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
      worker.current?.terminate();
      worker.current = undefined;
    },
    [url],
  );
  useEffect(() => {
    if (file?.type === "application/pdf") void renderPdf(file, page);
  }, [file, page]);
  async function load(next: File) {
    if (next.size > 20 * 1024 * 1024) {
      setMessage("Use a file smaller than 20 MB.");
      return;
    }
    if (!/^(image\/(png|jpeg|webp)|application\/pdf)$/.test(next.type)) {
      setMessage("Choose PNG, JPEG, WEBP, or PDF.");
      return;
    }
    setFile(next);
    setText("");
    setPage(1);
    setPages(1);
    setRect({ x: 0, y: 0, w: 100, h: 100 });
    setMessage("");
    if (url) URL.revokeObjectURL(url);
    setUrl(next.type === "application/pdf" ? "" : URL.createObjectURL(next));
  }
  async function renderPdf(pdf: File, index: number) {
    const job = ++pdfJob.current;
    setBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = (
        await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
      ).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(await pdf.arrayBuffer()),
      });
      const document = await loadingTask.promise;
      if (job !== pdfJob.current) {
        await loadingTask.destroy();
        return;
      }
      setPages(Math.min(document.numPages, 50));
      const target = await document.getPage(index);
      const content = await target.getTextContent();
      const lines: string[] = [];
      let line = "",
        previousY: number | undefined;
      for (const item of content.items as any[]) {
        const value = String(item.str || "").trim();
        if (!value) continue;
        const y = Number(item.transform?.[5]);
        if (
          previousY !== undefined &&
          Number.isFinite(y) &&
          Math.abs(y - previousY) > 2
        ) {
          if (line.trim()) lines.push(line.trim());
          line = "";
        }
        line += `${line ? " " : ""}${value}`;
        if (item.hasEOL) {
          lines.push(line.trim());
          line = "";
        }
        previousY = y;
      }
      if (line.trim()) lines.push(line.trim());
      const extracted = lines.join("\n");
      if (job !== pdfJob.current) {
        await loadingTask.destroy();
        return;
      }
      setText(extracted);
      const natural = target.getViewport({ scale: 1 });
      const view = target.getViewport({
        scale: Math.min(
          2,
          1800 / natural.width,
          2400 / natural.height,
          Math.sqrt(5_000_000 / (natural.width * natural.height)),
        ),
      });
      const c = canvas.current;
      if (!c) {
        await loadingTask.destroy();
        return;
      }
      c.width = view.width;
      c.height = view.height;
      await target.render({
        canvas: c,
        canvasContext: c.getContext("2d")!,
        viewport: view,
      }).promise;
      await loadingTask.destroy();
      setMessage(
        extracted
          ? "Selectable PDF text extracted. You can also run OCR on the displayed page."
          : "This page has no selectable text. Run Text OCR on the rendered page.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not open this PDF. It may be encrypted or damaged.",
      );
    } finally {
      if (job === pdfJob.current) setBusy(false);
    }
  }
  async function recognize() {
    setBusy(true);
    setProgress(0);
    setMessage(
      "Loading English text recognition assets from this site. Your image stays in this browser.",
    );
    try {
      const { createWorker } = await import("tesseract.js");
      if (!worker.current)
        worker.current = await createWorker("eng", 1, {
          workerPath: "/math/ocr/worker.min.js",
          corePath: "/math/ocr",
          langPath: "/math/ocr",
          workerBlobURL: false,
          logger: (status: any) => {
            if (typeof status.progress === "number")
              setProgress(Math.round(status.progress * 100));
          },
        });
      let source: HTMLCanvasElement | File = file!;
      const c = canvas.current;
      if (c) {
        const context = c.getContext("2d");
        if (context) {
          const crop = document.createElement("canvas");
          const x = Math.floor((c.width * rect.x) / 100),
            y = Math.floor((c.height * rect.y) / 100);
          crop.width = Math.max(1, Math.floor((c.width * rect.w) / 100));
          crop.height = Math.max(1, Math.floor((c.height * rect.h) / 100));
          crop
            .getContext("2d")!
            .drawImage(
              c,
              x,
              y,
              crop.width,
              crop.height,
              0,
              0,
              crop.width,
              crop.height,
            );
          source = crop;
        }
      }
      const result = await worker.current.recognize(source);
      setText(result.data.text.trim());
      setMessage(
        result.data.text.trim()
          ? `Text OCR complete. Engine confidence: ${Math.round(result.data.confidence)}%. Review before using.`
          : "No text found in the selected region. Try a tighter crop or clearer image.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Text recognition failed.",
      );
      await worker.current?.terminate();
      worker.current = undefined;
    } finally {
      setBusy(false);
    }
  }
  async function imageReady() {
    const c = canvas.current;
    if (!c || !url) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 2400 / Math.max(img.width, img.height));
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    };
    img.src = url;
  }
  return (
    <section className="ms-panel">
      <div className="ms-heading">
        <div>
          <span className="ms-kicker">01 / SCAN</span>
          <h2>Bring in a page</h2>
          <p>
            Extract ordinary printed text locally. Equation image recognition is
            still under evaluation; verify formulas in the editor.
          </p>
        </div>
      </div>
      <label
        className="ms-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) void load(f);
        }}
      >
        Drop an image or PDF here, or <span>browse files</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void load(f);
          }}
        />
      </label>
      {file && (
        <>
          <div className="ms-toolbar">
            <strong>{file.name}</strong>
            {file.type === "application/pdf" && (
              <>
                <button
                  disabled={page <= 1 || busy}
                  onClick={() => {
                    setPage(page - 1);
                  }}
                >
                  Previous
                </button>
                <span>
                  Page {page} / {pages}
                </span>
                <button
                  disabled={page >= pages || busy}
                  onClick={() => {
                    setPage(page + 1);
                  }}
                >
                  Next
                </button>
              </>
            )}
            <button
              onClick={() => {
                setFile(undefined);
                setUrl("");
                pdfJob.current++;
                setText("");
                setMessage("");
              }}
            >
              Remove
            </button>
          </div>
          <canvas
            ref={canvas}
            onLoad={imageReady}
            className="ms-scan-canvas"
            aria-label="Selected document preview"
          />
          {url && (
            <img
              src={url}
              onLoad={imageReady}
              alt="Uploaded source"
              className="ms-hidden"
            />
          )}
          <div className="ms-crop">
            <span>Crop %:</span>
            {(["x", "y", "w", "h"] as const).map((key) => (
              <label key={key}>
                {key.toUpperCase()}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rect[key]}
                  onChange={(e) =>
                    setRect({ ...rect, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <button
            className="ms-primary"
            disabled={busy}
            onClick={() => void recognize()}
          >
            {busy ? "Working…" : "Run text OCR on crop"}
          </button>
          {busy && (
            <progress value={progress} max="100" aria-label="OCR progress" />
          )}
        </>
      )}
      {message && (
        <p role="status" className="ms-note">
          {message}
        </p>
      )}
      {text && (
        <div className="ms-field">
          <label htmlFor="scan-output">Editable extracted text</label>
          <textarea
            id="scan-output"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="ms-toolbar">
            <button onClick={() => void navigator.clipboard.writeText(text)}>
              Copy text
            </button>
            <button onClick={() => onUse(text)}>Send to editor</button>
          </div>
        </div>
      )}
      <div className="ms-limit">
        <strong>Equation OCR status</strong>
        <p>
          Image-to-LaTeX and handwriting recognition are unavailable in this
          release. No formula is inferred from ordinary text OCR. Type or
          correct the formula in Editor.
        </p>
      </div>
    </section>
  );
}
