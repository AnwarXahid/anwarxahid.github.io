import { sample2D, sample3D, solve } from "../math/engine";

self.onmessage = (
  event: MessageEvent<{ id: number; type: string; payload: any }>,
) => {
  const { id, type, payload } = event.data;
  try {
    const result =
      type === "solve"
        ? solve(
            payload.input,
            payload.operation,
            payload.variable,
            payload.lower,
            payload.upper,
          )
        : type === "graph2d"
          ? sample2D(payload.input, payload.min, payload.max, payload.samples)
          : type === "graph3d"
            ? sample3D(payload.input, payload.bound, payload.resolution)
            : undefined;
    if (result === undefined) throw new Error("Unknown operation.");
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
