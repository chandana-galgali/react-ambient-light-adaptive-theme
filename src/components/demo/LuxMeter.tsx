"use client";

import type { CSSProperties } from "react";
import { normalizeThresholds, useAmbientTheme } from "@/lib";
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
}

function describeSource(source: string, theme: string): string {
  switch (source) {
    case "sensor":
      return `your device's light sensor, which says ${theme}`;
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

export function LuxMeter({ lux, setLux, config }: Props) {
  const { theme, source, illuminance, mode, setMode } = useAmbientTheme();
  const [dark, light] = normalizeThresholds(config.darkThreshold, config.lightThreshold);
  const shown = lux ?? illuminance;
  const position = shown === null ? null : luxToPosition(shown);

  let status: string;
  if (mode !== "auto") {
    status = `You've set the theme to ${mode}, so readings are ignored. Switch to Auto to see it react.`;
  } else if (lux === null) {
    status = `Drag the needle or pick a room to simulate the light around you. Right now the theme follows ${describeSource(source, theme)}.`;
  } else if (lux < dark) {
    status = `Below ${dark} lx, so the theme is dark.`;
  } else if (lux > light) {
    status = `Above ${light} lx, so the theme is light.`;
  } else {
    status = `Between ${dark} and ${light} lx, so it keeps the ${theme} theme it already had.`;
  }

  const style = {
    "--needle": position ?? 0.5,
    "--zone-start": luxToPosition(dark),
    "--zone-end": luxToPosition(light),
  } as CSSProperties;

  return (
    <div className="meter" style={style} data-idle={shown === null || undefined}>
      <div className="meter-readout" aria-live="polite">
        {shown === null ? (
          <p className="meter-value meter-value-idle">No reading yet</p>
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
        <input
          className="meter-input"
          type="range"
          min={LOG_MIN}
          max={LOG_MAX}
          step={0.01}
          value={position === null ? 2 : LOG_MIN + position * (LOG_MAX - LOG_MIN)}
          onChange={(event) => {
            const value = Number(event.currentTarget.value);
            const raw = 10 ** value;
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
      </div>

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
    </div>
  );
}
