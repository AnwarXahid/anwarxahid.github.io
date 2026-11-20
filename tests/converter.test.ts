import { it, expect } from "vitest";
import { encodeWav } from "../src/components/services/converter-tools";

it("encodes an AudioBuffer into a valid RIFF WAVE 16-bit PCM header and payload", () => {
  // Create a mock AudioBuffer
  const sampleRate = 44100;
  const numChannels = 2;
  const length = 1000;
  const channelDataLeft = new Float32Array(length);
  const channelDataRight = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    channelDataLeft[i] = Math.sin((i / 44100) * 440 * 2 * Math.PI);
    channelDataRight[i] = -Math.sin((i / 44100) * 440 * 2 * Math.PI);
  }

  const mockAudioBuffer = {
    sampleRate,
    numberOfChannels: numChannels,
    length,
    duration: length / sampleRate,
    getChannelData(channel: number) {
      return channel === 0 ? channelDataLeft : channelDataRight;
    },
  } as unknown as AudioBuffer;

  const wavBytes = encodeWav(mockAudioBuffer);

  // Check header
  const header = String.fromCharCode(...wavBytes.slice(0, 4));
  expect(header).toBe("RIFF");
  const wave = String.fromCharCode(...wavBytes.slice(8, 12));
  expect(wave).toBe("WAVE");
  const fmt = String.fromCharCode(...wavBytes.slice(12, 16));
  expect(fmt).toBe("fmt ");
  const data = String.fromCharCode(...wavBytes.slice(36, 40));
  expect(data).toBe("data");

  // Check total size = 44 + (1000 * 2 channels * 2 bytes) = 44 + 4000 = 4044
  expect(wavBytes.byteLength).toBe(4044);
});
