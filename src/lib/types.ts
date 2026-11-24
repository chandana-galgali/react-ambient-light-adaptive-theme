/** The two themes the provider can resolve to. */
export type Theme = "light" | "dark";

/**
 * How the theme is chosen.
 * - `auto`: follow the light sensor, then the configured fallback.
 * - `light` / `dark`: a manual override chosen by the user.
 */
export type ThemeMode = "auto" | Theme;

/**
 * What to use when no ambient light reading is available.
 * - `system`: the OS / browser `prefers-color-scheme` setting (live).
 * - `time-based`: dark between `nightStart` and `nightEnd` (local time).
 * - `light` / `dark`: always this theme.
 */
export type Fallback = "system" | "time-based" | Theme;

/** Where the current theme came from. */
export type ThemeSource =
  | "sensor"
  | "simulated"
  | "system"
  | "time"
  | "static"
  | "manual";

/** State of the ambient light sensor. */
export type SensorStatus =
  | "idle"
  | "unsupported"
  | "pending"
  | "active"
  | "denied"
  | "error"
  | "simulated";

/**
 * Where to write the theme in the DOM.
 * - `"class"` adds `light` or `dark` to `<html>`.
 * - `"data-*"` sets that attribute on `<html>` (e.g. `data-theme="dark"`).
 * - `null` leaves the DOM alone (read the theme from the hook instead).
 */
export type ThemeAttribute = "class" | `data-${string}` | null;
