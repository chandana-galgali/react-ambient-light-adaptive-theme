"use client";

import type { CSSProperties } from "react";
import { normalizeThresholds, useAmbientTheme, type SensorStatus } from "@/lib";
import type { DemoConfig } from "./Demo";
import {
  LOG_MAX,
  LOG_MIN,
  PRESETS,
  SCALE_TICKS,
  formatLux,
  formatTick,
  luxToPosition,
} from "./site";

interface Props {
  lux: number | null;
  setLux: (lux: number | null) => void;
  config: DemoConfig;
  setCamera: (on: boolean) => void;
}

function describeSource(source: string, theme: string): string {
  switch (source) {
    case "sensor":
      return `your device's light sensor, which says ${theme}`;
    case "camera":
      return `your camera, which says ${theme}`;
    case "system":
      return `your system setting, which is ${theme}`;
    case "time":
      return `the time of day, which means ${theme}`;
    case "static":
      return `a fixed ${theme} fallback`;
    case "manual":
      return `your manual choice of ${theme}`;
    default:
      return theme;
  }
}

const CAMERA_PROBLEMS: Partial<Record<SensorStatus, string>> = {
  pending: "Allow camera access when your browser asks.",
  denied:
    "Camera access is blocked. Allow it for this site in your browser settings, then turn the camera on again.",
  unsupported:
    "This browser can't open the camera on this page. Cameras need HTTPS, so open the https:// version of the demo.",
  error: "The camera couldn't start. Close other apps that might be using it and try again.",
};

const percent = (value: number) => `${Math.round(value * 100)}`;

export function LuxMeter({ lux, setLux, config, setCamera }: Props) {
  const { theme, source, illuminance, brightness, mode, setMode, sensorStatus } =
    useAmbientTheme();
  const camera = config.lightSource === "camera";

  const [dark, light] = camera
    ? normalizeThresholds(config.cameraDarkThreshold, config.cameraLightThreshold)
    : normalizeThresholds(config.darkThreshold, config.lightThreshold);

  // What the needle shows: camera brightness (linear 0–1) or lux (log scale).
  const shown = camera ? brightness : (lux ?? illuminance);
  const position =
    shown === null ? null : camera ? Math.min(Math.max(shown, 0), 1) : luxToPosition(shown);

  let status: string;
  if (mode !== "auto") {
    status = `You've set the theme to ${mode}, so readings are ignored. Switch to Auto to see it react.`;
  } else if (camera && sensorStatus !== "active") {
    status = CAMERA_PROBLEMS[sensorStatus] ?? "Starting the camera…";
  } else if (camera && shown !== null) {
    const zone =
      shown < dark
        ? `Below ${percent(dark)}%, so the theme is dark.`
        : shown > light
          ? `Above ${percent(light)}%, so the theme is light.`
          : `Between ${percent(dark)}% and ${percent(light)}%, so it keeps the ${theme} theme.`;
    status =
      theme === "dark"
        ? `${zone} Uncover the camera or turn on a light to go back to light.`
        : `${zone} Cover the camera with your hand to go dark.`;
  } else if (lux === null) {
    status = `Drag the needle or pick a room to simulate the light around you, or use your camera as a light meter. Right now the theme follows ${describeSource(source, theme)}.`;
  } else if (lux < dark) {
    status = `Below ${dark} lx, so the theme is dark.`;
  } else if (lux > light) {
    status = `Above ${light} lx, so the theme is light.`;
  } else {
    status = `Between ${dark} and ${light} lx, so it keeps the ${theme} theme it already had.`;
  }

  const style = {
    "--needle": position ?? 0.5,
    "--zone-start": camera ? dark : luxToPosition(dark),
    "--zone-end": camera ? light : luxToPosition(light),
  } as CSSProperties;

  return (
    <div
      className="meter"
      style={style}
      data-idle={shown === null || undefined}
      data-camera={camera || undefined}
    >
      <div className="meter-readout" aria-live="polite">
        {shown === null ? (
          <p className="meter-value meter-value-idle">
            {camera ? "Camera starting" : "No reading yet"}
          </p>
        ) : camera ? (
          <p className="meter-value">
            <span>{percent(shown)}</span>
            <abbr title="percent camera brightness">% bright</abbr>
          </p>
        ) : (
          <p className="meter-value">
            <span>{formatLux(shown)}</span>
            <abbr title="lux">lx</abbr>
          </p>
        )}
        <p className="meter-status">{status}</p>
        {mode !== "auto" && (
          <button type="button" className="text-button" onClick={() => setMode("auto")}>
            Switch to Auto
          </button>
        )}
      </div>

      <div className="meter-scale">
        <div className="meter-track" aria-hidden="true">
          <div className="meter-zone" />
          <div className="meter-needle" />
        </div>
        {camera ? (
          <ol className="meter-ticks" aria-hidden="true">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <li key={tick} style={{ "--at": tick } as CSSProperties}>
                {percent(tick)}%
              </li>
            ))}
          </ol>
        ) : (
          <>
            <input
              className="meter-input"
              type="range"
              min={LOG_MIN}
              max={LOG_MAX}
              step={0.01}
              value={position === null ? 2 : LOG_MIN + position * (LOG_MAX - LOG_MIN)}
              onChange={(event) => {
                const raw = 10 ** Number(event.currentTarget.value);
                setLux(raw < 10 ? Math.round(raw * 10) / 10 : Math.round(raw));
              }}
              aria-label="Simulated ambient light"
              aria-valuetext={shown === null ? "Not simulating" : `${formatLux(shown)} lux`}
            />
            <ol className="meter-ticks" aria-hidden="true">
              {SCALE_TICKS.map((tick) => (
                <li key={tick} style={{ "--at": luxToPosition(tick) } as CSSProperties}>
                  {formatTick(tick)}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      {camera ? (
        <div className="meter-camera">
          <button type="button" className="button" onClick={() => setCamera(false)}>
            Turn off camera
          </button>
          <p className="meter-note">
            The camera image is reduced to one brightness number on your
            device. Nothing is recorded or uploaded.
          </p>
        </div>
      ) : (
        <>
          <div className="meter-presets" role="group" aria-label="Typical light levels">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={lux === preset.lux}
                onClick={() => setLux(preset.lux)}
              >
                <span>{preset.label}</span>
                <small>{formatLux(preset.lux)} lx</small>
              </button>
            ))}
            {lux !== null && (
              <button type="button" className="meter-stop" onClick={() => setLux(null)}>
                Stop simulating
              </button>
            )}
          </div>
          <div className="meter-camera">
            <button type="button" className="button" onClick={() => setCamera(true)}>
              Use my camera as a light meter
            </button>
            <p className="meter-note">
              No light sensor? Most devices have one, but browsers rarely share
              it. Your camera works on almost any phone or laptop, iPhone
              included.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
