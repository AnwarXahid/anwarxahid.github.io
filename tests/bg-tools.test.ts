import { it, expect } from "vitest";
import { removeBackground } from "../src/components/services/bg-tools";

it("erases background pixels connected to borders and sets alpha to 0", () => {
  // Create a 10x10 mock image with white background and red center
  const width = 10;
  const height = 10;
  const buffer = new Uint8ClampedArray(width * height * 4);

  // Fill with white (255, 255, 255, 255)
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 255;
    buffer[i + 1] = 255;
    buffer[i + 2] = 255;
    buffer[i + 3] = 255;
  }

  // Draw 4x4 red square in center (x: 3..6, y: 3..6)
  for (let y = 3; y <= 6; y++) {
    for (let x = 3; x <= 6; x++) {
      const idx = (y * width + x) * 4;
      buffer[idx] = 255; // R
      buffer[idx + 1] = 0; // G
      buffer[idx + 2] = 0; // B
      buffer[idx + 3] = 255; // A
    }
  }

  const mockImageData = {
    width,
    height,
    data: buffer,
    colorSpace: "srgb",
  } as ImageData;

  const result = removeBackground(mockImageData, {
    tolerance: 10,
    feather: 0,
    floodFillOnly: true,
  });

  // Top-left corner (0,0) must now have alpha = 0 (transparent)
  expect(result.data[3]).toBe(0);

  // Center pixel (5,5) must remain red and opaque (alpha = 255)
  const centerIdx = (5 * width + 5) * 4;
  expect(result.data[centerIdx]).toBe(255);
  expect(result.data[centerIdx + 1]).toBe(0);
  expect(result.data[centerIdx + 2]).toBe(0);
  expect(result.data[centerIdx + 3]).toBe(255);
});
