import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULTS,
  classifyIlluminance,
  isNightHour,
  normalizeThresholds,
  parseMode,
  resolveTheme,
  smoothIlluminance,
  themeFromTime,
} from "../src/lib/core";

describe("classifyIlluminance", () => {
  it("is dark below the dark threshold and light above the light threshold", () => {
    assert.equal(classifyIlluminance(5, null), "dark");
    assert.equal(classifyIlluminance(29.9, "light"), "dark");
    assert.equal(classifyIlluminance(400, null), "light");
    assert.equal(classifyIlluminance(60.1, "dark"), "light");
  });

  it("keeps the previous theme inside the hold zone (hysteresis)", () => {
    assert.equal(classifyIlluminance(45, "dark"), "dark");
    assert.equal(classifyIlluminance(45, "light"), "light");
    assert.equal(classifyIlluminance(30, "light"), "light");
    assert.equal(classifyIlluminance(60, "dark"), "dark");
  });

  it("uses the midpoint when there is no previous theme", () => {
    assert.equal(classifyIlluminance(40, null), "dark");
    assert.equal(classifyIlluminance(50, null), "light");
  });

  it("accepts thresholds passed in the wrong order", () => {
    assert.deepEqual(normalizeThresholds(100, 10), [10, 100]);
    assert.equal(classifyIlluminance(5, null, 100, 10), "dark");
    assert.equal(classifyIlluminance(150, null, 100, 10), "light");
  });

  it("behaves like a single threshold when both are equal", () => {
    assert.equal(classifyIlluminance(39, "light", 40, 40), "dark");
    assert.equal(classifyIlluminance(41, "dark", 40, 40), "light");
  });

  it("does not flicker on a noisy signal around one threshold", () => {
    let theme: "light" | "dark" | null = null;
    const seen = new Set<string>();
    for (const lux of [70, 58, 61, 55, 62, 59, 64, 57]) {
      theme = classifyIlluminance(lux, theme);
      seen.add(theme);
    }
    assert.deepEqual([...seen], ["light"]);
  });
});

describe("smoothIlluminance", () => {
  it("returns the first reading unchanged", () => {
    assert.equal(smoothIlluminance(null, 120), 120);
  });

  it("blends towards the new reading", () => {
    assert.equal(smoothIlluminance(100, 0, 0.5), 50);
    assert.equal(smoothIlluminance(100, 0, 0), 0);
  });

  it("clamps smoothing so readings always move", () => {
    const value = smoothIlluminance(100, 0, 5);
    assert.ok(value < 100 && value > 0);
  });
});

describe("time-based fallback", () => {
  it("handles a window that wraps past midnight", () => {
    assert.equal(isNightHour(19), true);
    assert.equal(isNightHour(23), true);
    assert.equal(isNightHour(0), true);
    assert.equal(isNightHour(6), true);
    assert.equal(isNightHour(7), false);
    assert.equal(isNightHour(12), false);
    assert.equal(isNightHour(18), false);
  });

  it("handles a window inside one day", () => {
    assert.equal(isNightHour(2, 1, 5), true);
    assert.equal(isNightHour(5, 1, 5), false);
    assert.equal(isNightHour(0, 1, 5), false);
  });

  it("treats equal start and end as never night", () => {
    for (let h = 0; h < 24; h++) assert.equal(isNightHour(h, 8, 8), false);
  });

  it("maps a date to a theme", () => {
    assert.equal(themeFromTime(new Date(2026, 0, 1, 21)), "dark");
    assert.equal(themeFromTime(new Date(2026, 0, 1, 10)), "light");
  });
});

describe("resolveTheme", () => {
  const base = {
    sensorSource: "sensor" as const,
    fallbackTheme: "dark" as const,
    fallback: "system" as const,
  };

  it("prefers a manual override", () => {
    assert.deepEqual(
      resolveTheme({ ...base, mode: "light", sensorTheme: "dark" }),
      { theme: "light", source: "manual" },
    );
  });

  it("uses the sensor in auto mode", () => {
    assert.deepEqual(
      resolveTheme({ ...base, mode: "auto", sensorTheme: "light" }),
      { theme: "light", source: "sensor" },
    );
  });

  it("falls back and reports where the theme came from", () => {
    assert.deepEqual(resolveTheme({ ...base, mode: "auto", sensorTheme: null }), {
      theme: "dark",
      source: "system",
    });
    assert.equal(
      resolveTheme({ ...base, fallback: "time-based", mode: "auto", sensorTheme: null }).source,
      "time",
    );
    assert.equal(
      resolveTheme({ ...base, fallback: "dark", mode: "auto", sensorTheme: null }).source,
      "static",
    );
  });
});

describe("parseMode", () => {
  it("accepts only known modes", () => {
    assert.equal(parseMode("dark"), "dark");
    assert.equal(parseMode("auto"), "auto");
    assert.equal(parseMode("sepia"), null);
    assert.equal(parseMode(null), null);
  });
});

describe("defaults", () => {
  it("keep the hold zone open", () => {
    assert.ok(DEFAULTS.darkThreshold < DEFAULTS.lightThreshold);
  });
});
