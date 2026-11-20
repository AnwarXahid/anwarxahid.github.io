/**
 * Browser-local file conversion utilities for audio and image formats.
 * All processing is performed strictly locally using standard Web APIs.
 */

/**
 * Encode an AudioBuffer into a standard 16-bit PCM RIFF WAV file.
 */
export function encodeWav(audioBuffer: AudioBuffer): Uint8Array {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const numSamples = audioBuffer.length;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF Chunk Descriptor
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  // "fmt " sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamp to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer [-32768, 32767]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Uint8Array(buffer);
}

/**
 * Extract audio track from any browser-supported video/audio file into a WAV Blob.
 */
export async function extractAudioToWav(
  file: File,
  onProgress?: (percent: number, step: string) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  if (signal?.aborted) throw new Error("Conversion cancelled.");
  onProgress?.(10, "Reading media file…");

  const arrayBuffer = await file.arrayBuffer();
  if (signal?.aborted) throw new Error("Conversion cancelled.");
  onProgress?.(40, "Decoding audio stream…");

  // Web Audio Context
  const audioCtx = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch {
    throw new Error(
      "Could not decode audio from this file. It may have no audio track or an unsupported codec.",
    );
  } finally {
    try {
      await audioCtx.close();
    } catch {}
  }

  if (signal?.aborted) throw new Error("Conversion cancelled.");
  onProgress?.(75, "Encoding 16-bit PCM WAV…");

  const wavBytes = encodeWav(audioBuffer);
  if (signal?.aborted) throw new Error("Conversion cancelled.");
  onProgress?.(100, "Done.");

  return new Blob([wavBytes as unknown as BlobPart], { type: "audio/wav" });
}

/**
 * Convert an image (JPEG, PNG, WebP, SVG) to a target format (JPEG, PNG, WebP).
 */
export async function convertImage(
  file: File,
  targetFormat: "image/jpeg" | "image/png" | "image/webp",
  quality: number = 0.92,
): Promise<Blob> {
  let imgBitmap: ImageBitmap | HTMLImageElement;

  if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
    const text = await file.text();
    const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not render SVG."));
        img.src = url;
      });
      imgBitmap = img;
    } finally {
      URL.revokeObjectURL(url);
    }
  } else {
    try {
      imgBitmap = await createImageBitmap(file);
    } catch {
      throw new Error(
        `Could not decode image "${file.name}". Ensure it is a valid JPG, PNG, or WebP.`,
      );
    }
  }

  const width =
    "width" in imgBitmap
      ? imgBitmap.width
      : (imgBitmap as HTMLImageElement).naturalWidth;
  const height =
    "height" in imgBitmap
      ? imgBitmap.height
      : (imgBitmap as HTMLImageElement).naturalHeight;

  if (width * height > 25000000) {
    if ("close" in imgBitmap && typeof imgBitmap.close === "function")
      imgBitmap.close();
    throw new Error("Image exceeds 25 million pixels limit.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if ("close" in imgBitmap && typeof imgBitmap.close === "function")
      imgBitmap.close();
    throw new Error("Canvas context is unavailable.");
  }

  if (targetFormat === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
  if ("close" in imgBitmap && typeof imgBitmap.close === "function")
    imgBitmap.close();

  const qualityParam = targetFormat === "image/png" ? undefined : quality;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image encoding failed."));
      },
      targetFormat,
      qualityParam,
    );
  });
}
