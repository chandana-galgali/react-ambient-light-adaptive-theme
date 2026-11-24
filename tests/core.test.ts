import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  DEFAULTS,
  classifyIlluminance,
  createSwitchGate,
  isNightHour,
  normalizeThresholds,
  parseMode,
  resolveTheme,
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

describe("createSwitchGate", () => {
  function setup(delay = 1000) {
    const switches: string[] = [];
    const gate = createSwitchGate((t) => switches.push(t), () => delay);
    return { gate, switches };
  }

  it("takes the first theme immediately", () => {
    const { gate, switches } = setup();
    gate.push("light");
    assert.deepEqual(switches, ["light"]);
    assert.equal(gate.current, "light");
  });

  it("switches after the delay, even with no further readings", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const { gate, switches } = setup(1000);
      gate.push("light");
      gate.push("dark"); // a sensor reports a change once, then goes quiet
      mock.timers.tick(999);
      assert.deepEqual(switches, ["light"]);
      mock.timers.tick(1);
      assert.deepEqual(switches, ["light", "dark"]);
      assert.equal(gate.current, "dark");
    } finally {
      mock.timers.reset();
    }
  });

  it("cancels when readings go back before the delay ends", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const { gate, switches } = setup(1000);
      gate.push("light");
      gate.push("dark"); // a hand over the sensor
      mock.timers.tick(400);
      gate.push("light"); // hand moves away
      mock.timers.tick(5000);
      assert.deepEqual(switches, ["light"]);
    } finally {
      mock.timers.reset();
    }
  });

  it("does not restart the timer for repeated readings of the same theme", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const { gate, switches } = setup(1000);
      gate.push("light");
      gate.push("dark");
      mock.timers.tick(600);
      gate.push("dark");
      mock.timers.tick(400);
      assert.deepEqual(switches, ["light", "dark"]);
    } finally {
      mock.timers.reset();
    }
  });

  it("switches immediately when the delay is 0", () => {
    const { gate, switches } = setup(0);
    gate.push("light");
    gate.push("dark");
    assert.deepEqual(switches, ["light", "dark"]);
  });

  it("can be reset and disposed", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const { gate, switches } = setup(1000);
      gate.push("light");
      gate.push("dark");
      gate.dispose();
      mock.timers.tick(2000);
      assert.deepEqual(switches, ["light"]);
      gate.reset(null);
      gate.push("dark");
      assert.deepEqual(switches, ["light", "dark"]);
    } finally {
      mock.timers.reset();
    }
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
