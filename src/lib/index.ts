
export {
  AmbientLightThemeProvider,
  useAmbientTheme,
  useTheme,
  default,
} from "./AmbientLightThemeProvider";
export type {
  AmbientLightThemeProviderProps,
  AmbientThemeContextValue,
} from "./AmbientLightThemeProvider";

export {
  DEFAULTS,
  classifyIlluminance,
  createSwitchGate,
  isNightHour,
  normalizeThresholds,
  resolveTheme,
  themeFromTime,
} from "./core";
export type { SwitchGate } from "./core";
export { applyThemeToDocument, getThemeScript } from "./dom";
export type { ThemeScriptOptions } from "./dom";
export {
  isAmbientLightSensorSupported,
  queryAmbientLightPermission,
  startAmbientLightSensor,
} from "./sensor";
export type {
  Fallback,
  SensorStatus,
  Theme,
  ThemeAttribute,
  ThemeMode,
  ThemeSource,
} from "./types";
