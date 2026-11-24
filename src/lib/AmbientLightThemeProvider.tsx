"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULTS,
  classifyIlluminance,
  parseMode,
  resolveTheme,
  smoothIlluminance,
  themeFromTime,
} from "./core";
import { applyThemeToDocument } from "./dom";
import { isAmbientLightSensorSupported, startAmbientLightSensor } from "./sensor";
import type {
  Fallback,
  SensorStatus,
  Theme,
  ThemeAttribute,
  ThemeMode,
  ThemeSource,
} from "./types";

export interface AmbientLightThemeProviderProps {
  children: ReactNode;
  /** Used when no light reading is available. Default `"system"`. */
  fallback?: Fallback;
  /** Go dark below this many lux. Default `30`. */
  darkThreshold?: number;
  /** Go light above this many lux. Default `60`. */
  lightThreshold?: number;
  /** Weight of the previous reading, 0–0.95. Default `0.4`. */
  smoothing?: number;
  /** Sensor sampling rate in Hz. Default `1`. */
  frequency?: number;
  /** Hour the time-based fallback turns dark. Default `19`. */
  nightStart?: number;
  /** Hour the time-based fallback turns light. Default `7`. */
  nightEnd?: number;
  /** Where to write the theme on `<html>`. Default `"class"`. */
  attribute?: ThemeAttribute;
  /** localStorage key for the manual override, or `null` to not persist. */
  storageKey?: string | null;
  /** Mode before anything is stored. Default `"auto"`. */
  defaultMode?: ThemeMode;
  /** Don't touch the real sensor, even if supported. */
  disableSensor?: boolean;
  /**
   * Feed a lux value instead of reading the sensor — for demos, tests and
   * storybooks. `null` / `undefined` means "use the real sensor".
   */
  simulatedIlluminance?: number | null;
  /** Called whenever the resolved theme or its source changes. */
  onThemeChange?: (theme: Theme, source: ThemeSource) => void;
}

export interface AmbientThemeContextValue {
  /** The resolved theme. */
  theme: Theme;
  /** Shorthand for `theme === "dark"`. */
  isDarkMode: boolean;
  /** Why this theme was chosen. */
  source: ThemeSource;
  /** Latest (smoothed) reading in lux, or `null` without a sensor. */
  illuminance: number | null;
  /** State of the ambient light sensor. */
  sensorStatus: SensorStatus;
  /** Current mode: `auto` or a manual `light` / `dark` override. */
  mode: ThemeMode;
  /** Set the mode. Persisted when `storageKey` is set. */
  setMode: (mode: ThemeMode) => void;
  /** Switch to the opposite of the current theme (as a manual override). */
  toggleTheme: () => void;
}

const AmbientThemeContext = createContext<AmbientThemeContextValue | null>(null);

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, sandboxed iframe): ignore.
  }
}

export function AmbientLightThemeProvider({
  children,
  fallback = "system",
  darkThreshold = DEFAULTS.darkThreshold,
  lightThreshold = DEFAULTS.lightThreshold,
  smoothing = DEFAULTS.smoothing,
  frequency = DEFAULTS.frequency,
  nightStart = DEFAULTS.nightStart,
  nightEnd = DEFAULTS.nightEnd,
  attribute = "class",
  storageKey = DEFAULTS.storageKey,
  defaultMode = "auto",
  disableSensor = false,
  simulatedIlluminance,
  onThemeChange,
}: AmbientLightThemeProviderProps) {
  const [ready, setReady] = useState(false);
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [fallbackTheme, setFallbackTheme] = useState<Theme>(
    fallback === "dark" ? "dark" : "light",
  );
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>("idle");
  const [sensorTheme, setSensorTheme] = useState<Theme | null>(null);
  const [illuminance, setIlluminance] = useState<number | null>(null);

  const simulating =
    typeof simulatedIlluminance === "number" &&
    Number.isFinite(simulatedIlluminance);

  // Sensor callbacks read the latest options without restarting the sensor.
  const optionsRef = useRef({ darkThreshold, lightThreshold, smoothing });
  useEffect(() => {
    optionsRef.current = { darkThreshold, lightThreshold, smoothing };
  }, [darkThreshold, lightThreshold, smoothing]);

  const onThemeChangeRef = useRef(onThemeChange);
  useEffect(() => {
    onThemeChangeRef.current = onThemeChange;
  }, [onThemeChange]);

  // Restore a stored manual override.
  useEffect(() => {
    if (storageKey) {
      const stored = parseMode(readStorage(storageKey));
      if (stored) setModeState(stored);
    }
    setReady(true);
  }, [storageKey]);

  // Fallback theme: live system preference, a clock, or a fixed theme.
  useEffect(() => {
    if (fallback === "light" || fallback === "dark") {
      setFallbackTheme(fallback);
      return;
    }
    if (fallback === "system") {
      const query =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(prefers-color-scheme: dark)")
          : null;
      if (!query) {
        setFallbackTheme("light");
        return;
      }
      const update = () => setFallbackTheme(query.matches ? "dark" : "light");
      update();
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
      }
      // Safari < 14
      query.addListener(update);
      return () => query.removeListener(update);
    }
    const update = () =>
      setFallbackTheme(themeFromTime(new Date(), nightStart, nightEnd));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [fallback, nightStart, nightEnd]);

  // Simulated readings (no smoothing, so the UI follows the input exactly).
  useEffect(() => {
    if (!simulating) return;
    const lux = simulatedIlluminance as number;
    setSensorStatus("simulated");
    setIlluminance(lux);
    setSensorTheme((previous) =>
      classifyIlluminance(lux, previous, darkThreshold, lightThreshold),
    );
  }, [simulating, simulatedIlluminance, darkThreshold, lightThreshold]);

  // Real sensor.
  useEffect(() => {
    if (simulating) return;
    setSensorTheme(null);
    setIlluminance(null);
    if (disableSensor) {
      setSensorStatus("idle");
      return;
    }
    if (!isAmbientLightSensorSupported()) {
      setSensorStatus("unsupported");
      return;
    }
    setSensorStatus("pending");
    let smoothed: number | null = null;
    return startAmbientLightSensor({
      frequency,
      onReading: (lux) => {
        const options = optionsRef.current;
        const value = smoothIlluminance(smoothed, lux, options.smoothing);
        smoothed = value;
        setIlluminance(value);
        setSensorStatus("active");
        setSensorTheme((previous) =>
          classifyIlluminance(
            value,
            previous,
            options.darkThreshold,
            options.lightThreshold,
          ),
        );
      },
      onError: (reason) => {
        setSensorStatus(reason);
        setSensorTheme(null);
      },
    });
  }, [simulating, disableSensor, frequency]);

  // Re-check the real sensor's last reading when thresholds change.
  useEffect(() => {
    if (simulating || illuminance === null) return;
    setSensorTheme((previous) =>
      previous === null
        ? previous
        : classifyIlluminance(illuminance, previous, darkThreshold, lightThreshold),
    );
    // illuminance intentionally omitted: readings are classified as they arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkThreshold, lightThreshold, simulating]);

  const { theme, source } = resolveTheme({
    mode,
    sensorTheme,
    sensorSource: simulating ? "simulated" : "sensor",
    fallbackTheme,
    fallback,
  });

  useEffect(() => {
    if (ready) applyThemeToDocument(theme, attribute);
  }, [ready, theme, attribute]);

  useEffect(() => {
    if (ready) onThemeChangeRef.current?.(theme, source);
  }, [ready, theme, source]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      if (storageKey) writeStorage(storageKey, next);
    },
    [storageKey],
  );

  const toggleTheme = useCallback(() => {
    setMode(theme === "dark" ? "light" : "dark");
  }, [setMode, theme]);

  const value = useMemo<AmbientThemeContextValue>(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      source,
      illuminance,
      sensorStatus,
      mode,
      setMode,
      toggleTheme,
    }),
    [theme, source, illuminance, sensorStatus, mode, setMode, toggleTheme],
  );

  return (
    <AmbientThemeContext.Provider value={value}>
      {children}
    </AmbientThemeContext.Provider>
  );
}

/** Read the theme state. Must be used inside `<AmbientLightThemeProvider>`. */
export function useAmbientTheme(): AmbientThemeContextValue {
  const context = useContext(AmbientThemeContext);
  if (!context) {
    throw new Error(
      "useAmbientTheme must be used within an <AmbientLightThemeProvider>.",
    );
  }
  return context;
}

/** @deprecated Use `useAmbientTheme`. Kept for compatibility with 0.1.x. */
export const useTheme = useAmbientTheme;

export default AmbientLightThemeProvider;
