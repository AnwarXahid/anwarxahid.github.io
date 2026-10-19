export type MathJob = "solve" | "graph2d" | "graph3d";
let worker: Worker | undefined;
let id = 0;
const pending = new Map<
  number,
  {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timer: number;
  }
>();
function start() {
  worker = new Worker(new URL("../workers/math.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (
    event: MessageEvent<{ id: number; result?: unknown; error?: string }>,
  ) => {
    const task = pending.get(event.data.id);
    if (!task) return;
    clearTimeout(task.timer);
    pending.delete(event.data.id);
    event.data.error
      ? task.reject(new Error(event.data.error))
      : task.resolve(event.data.result);
  };
}
export function runMath<T>(
  type: MathJob,
  payload: unknown,
  timeout = 8000,
): Promise<T> {
  if (!worker) start();
  const current = ++id;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending
        .get(current)
        ?.reject(
          new Error(
            "Calculation timed out. Try a shorter expression or range.",
          ),
        );
      pending.delete(current);
      worker?.terminate();
      worker = undefined;
      for (const task of pending.values()) {
        clearTimeout(task.timer);
        task.reject(new Error("The calculation worker restarted."));
      }
      pending.clear();
    }, timeout);
    pending.set(current, { resolve, reject, timer });
    worker!.postMessage({ id: current, type, payload });
  });
}
export function stopMath() {
  worker?.terminate();
  worker = undefined;
  for (const task of pending.values()) {
    clearTimeout(task.timer);
    task.reject(new Error("Calculation cancelled."));
  }
  pending.clear();
}
