"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeThresholds, useAmbientTheme, type Theme } from "@/lib";
import type { DemoConfig } from "./Demo";
import { SCALE_TICKS, formatTick, luxToPosition } from "./site";

interface Sample {
  lux: number;
  theme: Theme;
}

const CAPACITY = 90;
const INTERVAL_MS = 200;
const W = 600;
const H = 240;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const PAD_Y = 12;
const PLOT_W = W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = H - PAD_Y * 2;

const y = (lux: number) => PAD_Y + (1 - luxToPosition(lux)) * PLOT_H;

interface Props {
  lux: number | null;
  config: DemoConfig;
}

export function ReadingsChart({ lux, config }: Props) {
  const { theme, illuminance, mode } = useAmbientTheme();
  const [samples, setSamples] = useState<Sample[]>([]);
  const latest = useRef<Sample | null>(null);

  const value = lux ?? illuminance;
  useEffect(() => {
    latest.current = value === null ? null : { lux: value, theme };
  }, [value, theme]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const sample = latest.current;
      if (!sample) return;
      setSamples((previous) => [...previous.slice(-(CAPACITY - 1)), sample]);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const [dark, light] = normalizeThresholds(config.darkThreshold, config.lightThreshold);
  const step = PLOT_W / (CAPACITY - 1);
  const offset = CAPACITY - samples.length;
  const points = samples
    .map((s, i) => `${(PAD_LEFT + (offset + i) * step).toFixed(1)},${y(s.lux).toFixed(1)}`)
    .join(" ");

  const flips = samples.reduce(
    (count, s, i) => (i > 0 && s.theme !== samples[i - 1].theme ? count + 1 : count),
    0,
  );

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          samples.length
            ? `Last ${samples.length} readings. The theme changed ${flips} times.`
            : "No readings yet."
        }
      >
        {samples.map((s, i) => (
          <rect
            key={i}
            className={`chart-col chart-col-${s.theme}`}
            x={PAD_LEFT + (offset + i) * step - step / 2}
            y={PAD_Y}
            width={step + 0.5}
            height={PLOT_H}
          />
        ))}
        <rect
          className="chart-zone"
          x={PAD_LEFT}
          y={y(light)}
          width={PLOT_W}
          height={Math.max(y(dark) - y(light), 1)}
        />
        {SCALE_TICKS.map((tick) => (
          <g key={tick} className="chart-grid">
            <line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y(tick)} y2={y(tick)} />
            <text x={PAD_LEFT - 8} y={y(tick) + 4} textAnchor="end">
              {formatTick(tick)}
            </text>
          </g>
        ))}
        <line className="chart-threshold" x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y(light)} y2={y(light)} />
        <line className="chart-threshold" x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y(dark)} y2={y(dark)} />
        {samples.length > 1 && <polyline className="chart-line" points={points} />}
        {samples.length === 0 && (
          <text className="chart-empty" x={PAD_LEFT + PLOT_W / 2} y={H / 2} textAnchor="middle">
            Move the needle above and readings will plot here
          </text>
        )}
      </svg>
      <figcaption>
        <span className="key key-zone">Hold zone, {dark}–{light} lx</span>
        <span className="key key-dark">Dark theme</span>
        <span className="key key-light">Light theme</span>
        {mode !== "auto" && <span>Readings are ignored while the theme is set manually.</span>}
      </figcaption>
    </figure>
  );
}
