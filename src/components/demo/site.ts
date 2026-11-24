export const PACKAGE_NAME = "react-ambient-light-adaptive-theme";
export const GITHUB_URL =
  "https://github.com/chandana-galgali/react-ambient-light-adaptive-theme";
export const NPM_URL = `https://www.npmjs.com/package/${PACKAGE_NAME}`;
export const SITE_URL =
  "https://chandana-galgali.github.io/react-ambient-light-adaptive-theme/";

/** Storage key the demo uses for its Auto / Light / Dark switch. */
export const STORAGE_KEY = "ambient-demo-mode";

/** The lux scale shown in the demo: 0.1 lx to 100,000 lx, logarithmic. */
export const LOG_MIN = -1;
export const LOG_MAX = 5;

export function clampLux(lux: number): number {
  return Math.min(Math.max(lux, 10 ** LOG_MIN), 10 ** LOG_MAX);
}

/** 0–1 position of a lux value on the log scale. */
export function luxToPosition(lux: number): number {
  return (Math.log10(clampLux(lux)) - LOG_MIN) / (LOG_MAX - LOG_MIN);
}

export function formatLux(lux: number): string {
  if (lux < 10) return lux.toFixed(1);
  return Math.round(lux).toLocaleString("en-US");
}

/** Typical illuminance values, from Wikipedia's lux reference table. */
export const PRESETS = [
  { label: "Full moon", lux: 0.2 },
  { label: "Civil twilight", lux: 3.4 },
  { label: "Living room", lux: 50 },
  { label: "Office", lux: 400 },
  { label: "Overcast day", lux: 1000 },
  { label: "Full daylight", lux: 20000 },
] as const;

export const SCALE_TICKS = [0.1, 1, 10, 100, 1000, 10000, 100000];

export function formatTick(lux: number): string {
  if (lux >= 1000) return `${lux / 1000}k`;
  return String(lux);
}
