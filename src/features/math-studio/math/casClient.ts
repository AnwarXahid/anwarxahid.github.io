import type { SolveResult } from "./engine";
let worker: Worker | undefined;
let nextId = 0;
export function runCas(
  payload: {
    input: string;
    operation: string;
    variable: string;
    lower?: number;
    upper?: number;
  },
  onProgress: (status: string) => void,
): Promise<SolveResult> {
  if (!worker)
    worker = new Worker(new URL("../workers/cas.worker.ts", import.meta.url), {
      type: "module",
    });
  const current = ++nextId;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker?.terminate();
      worker = undefined;
      reject(
        new Error(
          "Advanced CAS timed out after 60 seconds. Try a simpler expression.",
        ),
      );
    }, 60000);
    worker!.onmessage = (
      event: MessageEvent<{
        id?: number;
        result?: SolveResult;
        error?: string;
        progress?: string;
      }>,
    ) => {
      if (event.data.progress) {
        onProgress(event.data.progress);
        return;
      }
      if (event.data.id !== current) return;
      clearTimeout(timeout);
      event.data.error
        ? reject(new Error(event.data.error))
        : resolve(event.data.result!);
    };
    worker!.postMessage({ id: current, ...payload });
  });
}
export function stopCas() {
  worker?.terminate();
  worker = undefined;
}
