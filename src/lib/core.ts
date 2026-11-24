import type { Fallback, Theme, ThemeMode, ThemeSource } from "./types";

/** Default option values, shared by the provider and the no-flash script. */
export const DEFAULTS = {
  /** Switch to dark when illuminance drops below this (lux). */
  darkThreshold: 30,
  /** Switch to light when illuminance rises above this (lux). */
  lightThreshold: 60,
  /** Weight given to the previous reading (0 = none, 0.9 = heavy smoothing). */
  smoothing: 0.4,
  /** Sensor sampling frequency in Hz. */
  frequency: 1,
  /** Hour (0–23) at which the time-based fallback turns dark. */
  nightStart: 19,
  /** Hour (0–23) at which the time-based fallback turns light again. */
  nightEnd: 7,
  /** localStorage key used to remember a manual override. */
  storageKey: "ambient-theme-mode",
} as const;

/** Make sure `dark <= light`, swapping them if they were passed the wrong way round. */
export function normalizeThresholds(
  darkThreshold: number,
  lightThreshold: number,
): [dark: number, light: number] {
  return darkThreshold <= lightThreshold
    ? [darkThreshold, lightThreshold]
    : [lightThreshold, darkThreshold];
}

/**
 * Decide a theme from an illuminance reading, with hysteresis.
 *
 * Below `darkThreshold` is dark, above `lightThreshold` is light. Between the
 * two the previous theme is kept, so a reading hovering around one value
 * doesn't make the UI flicker. With no previous theme, the midpoint decides.
 */
export function classifyIlluminance(
  lux: number,
  previous: Theme | null,
  darkThreshold: number = DEFAULTS.darkThreshold,
  lightThreshold: number = DEFAULTS.lightThreshold,
): Theme {
  const [dark, light] = normalizeThresholds(darkThreshold, lightThreshold);
  if (lux < dark) return "dark";
  if (lux > light) return "light";
  if (previous) return previous;
  return lux < (dark + light) / 2 ? "dark" : "light";
}

/**
 * Exponential moving average of sensor readings.
 * `smoothing` is the weight of the previous value, clamped to [0, 0.95].
 */
export function smoothIlluminance(
  previous: number | null,
  next: number,
  smoothing: number = DEFAULTS.smoothing,
): number {
  if (previous === null || !Number.isFinite(previous)) return next;
  const s = Math.min(Math.max(smoothing, 0), 0.95);
  return previous * s + next * (1 - s);
}

/**
 * Is `hour` inside the night window? Windows may wrap past midnight
 * (19 → 7) or not (1 → 5). Equal start and end means "never night".
 */
export function isNightHour(
  hour: number,
  nightStart: number = DEFAULTS.nightStart,
  nightEnd: number = DEFAULTS.nightEnd,
): boolean {
  if (nightStart === nightEnd) return false;
  if (nightStart > nightEnd) return hour >= nightStart || hour < nightEnd;
  return hour >= nightStart && hour < nightEnd;
}

/** Theme for a given moment under the time-based fallback. */
export function themeFromTime(
  date: Date,
  nightStart: number = DEFAULTS.nightStart,
  nightEnd: number = DEFAULTS.nightEnd,
): Theme {
  return isNightHour(date.getHours(), nightStart, nightEnd) ? "dark" : "light";
}

/** Map a fallback option to the source label reported by the hook. */
export function fallbackSource(fallback: Fallback): ThemeSource {
  if (fallback === "system") return "system";
  if (fallback === "time-based") return "time";
  return "static";
}

/** Combine manual mode, sensor result and fallback into the final theme. */
export function resolveTheme(input: {
  mode: ThemeMode;
  sensorTheme: Theme | null;
  sensorSource: "sensor" | "simulated";
  fallbackTheme: Theme;
  fallback: Fallback;
}): { theme: Theme; source: ThemeSource } {
  if (input.mode !== "auto") return { theme: input.mode, source: "manual" };
  if (input.sensorTheme) {
    return { theme: input.sensorTheme, source: input.sensorSource };
  }
  return { theme: input.fallbackTheme, source: fallbackSource(input.fallback) };
}

/** Parse a stored mode string, ignoring anything unexpected. */
export function parseMode(value: unknown): ThemeMode | null {
  return value === "auto" || value === "light" || value === "dark"
    ? value
    : null;
}
