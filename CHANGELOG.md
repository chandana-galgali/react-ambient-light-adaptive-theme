# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-24

### Fixed

- Sensor readings were never used. The provider read `event.illuminance`, but the reading lives on the sensor (`sensor.illuminance`), so the theme always stayed light even on devices with a sensor.
- Removed the `alert()` popups that fired on every page load.
- The system-preference fallback now follows OS changes live, and the time-based fallback re-checks every minute instead of only on mount.
- The package could not be installed and imported: `package.json` had no `main`, `module`, `exports` or `types`, and the build config referenced Rollup plugins that weren't installed.

### Added

- Hysteresis: separate `darkThreshold` (30 lx) and `lightThreshold` (60 lx) so readings near the cut-off don't make the theme flicker.
- `switchDelay` (default 1000 ms): a new theme must hold that long before switching, so a passing shadow is ignored. Works with sensors that only report on change.
- `frequency` option for the sensor.
- Permission check for `ambient-light-sensor`, and a `sensorStatus` value (`unsupported`, `denied`, `active` and others).
- Manual override with `mode`, `setMode` and `toggleTheme`, remembered in localStorage (`storageKey`, `defaultMode`).
- Fixed fallbacks (`"light"`, `"dark"`) and configurable night hours (`nightStart`, `nightEnd`).
- `attribute` option to write a `data-*` attribute instead of a class, plus `color-scheme` on `<html>`.
- `<AmbientThemeScript>` and `getThemeScript()` from `react-ambient-light-adaptive-theme/script` to prevent a flash of the wrong theme in server-rendered apps.
- `simulatedIlluminance`, `disableSensor` and `onThemeChange` props.
- `useAmbientTheme()` hook exposing `theme`, `source`, `illuminance` and more.
- Exported pure helpers (`classifyIlluminance`, `createSwitchGate`, `themeFromTime`, `startAmbientLightSensor` and others).
- ESM and CommonJS builds with TypeScript declarations, marked `"use client"` for React Server Components.
- Unit tests, an end-to-end test that drives the real sensor code with a virtual light sensor (`npm run test:sensor`), GitHub Actions CI, and an interactive demo site deployed to GitHub Pages.

### Changed

- The theme is applied to `<html>` instead of `<body>`, and the provider applies it itself, so the separate `ThemeSetter` component is gone.
- `react` is now a peer dependency (`>=16.8`) instead of a bundled dependency.
- `useTheme` is kept as a deprecated alias of `useAmbientTheme`.

## [0.1.1] - 2025

- Initial release: `AmbientLightThemeProvider` with `system` and `time-based` fallbacks.

[1.0.0]: https://github.com/chandana-galgali/react-ambient-light-adaptive-theme/releases/tag/v1.0.0
[0.1.1]: https://github.com/chandana-galgali/react-ambient-light-adaptive-theme/commits/main
