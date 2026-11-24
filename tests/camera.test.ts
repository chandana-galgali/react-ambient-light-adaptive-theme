import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCameraSupported, meanBrightness } from "../src/lib/camera";

const pixels = (rgb: [number, number, number], count = 4) =>
  Array.from({ length: count }, () => [...rgb, 255]).flat();

describe("meanBrightness", () => {
  it("is 0 for black and 1 for white", () => {
    assert.equal(meanBrightness(pixels([0, 0, 0])), 0);
    assert.ok(Math.abs(meanBrightness(pixels([255, 255, 255])) - 1) < 1e-9);
  });

  it("weights green more than blue (perceived brightness)", () => {
    const green = meanBrightness(pixels([0, 255, 0]));
    const blue = meanBrightness(pixels([0, 0, 255]));
    assert.ok(green > 0.7 && blue < 0.08);
  });

  it("averages across pixels and ignores alpha", () => {
    const half = [...pixels([255, 255, 255], 1), 0, 0, 0, 0];
    assert.ok(Math.abs(meanBrightness(half) - 0.5) < 1e-9);
  });

  it("handles empty frames", () => {
    assert.equal(meanBrightness([]), 0);
  });
});

describe("isCameraSupported", () => {
  it("is false outside a browser", () => {
    assert.equal(isCameraSupported(), false);
  });
});
