/**
 * Browser-local background removal and alpha matting algorithms.
 * Produces real transparent PNGs with true alpha channels.
 */

export type BgRemovalOptions = {
  targetColor?: [number, number, number]; // [R, G, B]
  tolerance?: number; // 0 to 100
  feather?: number; // 0 to 20
  floodFillOnly?: boolean; // only remove background connected to borders
};

/**
 * Remove background from an ImageData buffer by computing color distance,
 * flood-filling from borders, and applying soft alpha feathering.
 */
export function removeBackground(
  imageData: ImageData,
  options: BgRemovalOptions = {},
): ImageData {
  const { width, height, data } = imageData;
  const tolerance = (options.tolerance ?? 25) * 2.55; // scale to 0-255
  const feather = options.feather ?? 2;
  const floodFillOnly = options.floodFillOnly ?? true;

  // Determine reference background color from border samples if not supplied
  let bgR = 255,
    bgG = 255,
    bgB = 255;
  if (options.targetColor) {
    [bgR, bgG, bgB] = options.targetColor;
  } else {
    // Average corner samples
    const corners = [
      0, // top-left
      (width - 1) * 4, // top-right
      (height - 1) * width * 4, // bottom-left
      ((height - 1) * width + width - 1) * 4, // bottom-right
    ];
    let rSum = 0,
      gSum = 0,
      bSum = 0;
    for (const c of corners) {
      rSum += data[c];
      gSum += data[c + 1];
      bSum += data[c + 2];
    }
    bgR = Math.round(rSum / 4);
    bgG = Math.round(gSum / 4);
    bgB = Math.round(bSum / 4);
  }

  function colorDist(idx: number): number {
    const dr = data[idx] - bgR;
    const dg = data[idx + 1] - bgG;
    const db = data[idx + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // Map of pixels to mark as transparent: 0 = foreground, 1 = background
  const mask = new Uint8Array(width * height);

  if (floodFillOnly) {
    // Breadth-first flood fill starting from all border pixels
    const queue: number[] = [];
    const visited = new Uint8Array(width * height);

    // Seed borders
    for (let x = 0; x < width; x++) {
      queue.push(x); // top
      queue.push((height - 1) * width + x); // bottom
    }
    for (let y = 1; y < height - 1; y++) {
      queue.push(y * width); // left
      queue.push(y * width + width - 1); // right
    }

    for (let i = 0; i < queue.length; i++) {
      visited[queue[i]] = 1;
    }

    let head = 0;
    while (head < queue.length) {
      const p = queue[head++];
      const px = p % width;
      const py = Math.floor(p / width);
      const dataIdx = p * 4;

      if (colorDist(dataIdx) <= tolerance) {
        mask[p] = 1; // Mark as background

        // Check 4 neighbors
        const neighbors = [];
        if (px > 0) neighbors.push(p - 1);
        if (px < width - 1) neighbors.push(p + 1);
        if (py > 0) neighbors.push(p - width);
        if (py < height - 1) neighbors.push(p + width);

        for (const n of neighbors) {
          if (!visited[n]) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
    }
  } else {
    // Global color threshold
    for (let p = 0; p < width * height; p++) {
      if (colorDist(p * 4) <= tolerance) {
        mask[p] = 1;
      }
    }
  }

  // Apply alpha feathering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const idx = p * 4;

      if (mask[p] === 1) {
        data[idx + 3] = 0; // Completely transparent
      } else if (feather > 0) {
        // Check distance to nearest transparent pixel within feather radius
        let minClearDist = feather + 1;
        for (let dy = -feather; dy <= feather; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -feather; dx <= feather; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            if (mask[ny * width + nx] === 1) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minClearDist) minClearDist = dist;
            }
          }
        }

        if (minClearDist <= feather) {
          const factor = minClearDist / (feather + 1);
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }
      }
    }
  }

  return imageData;
}
