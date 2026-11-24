"use client";

import type { Fallback } from "@/lib";
import { CodeBlock } from "./CodeBlock";
import { DEFAULT_CONFIG, type DemoConfig } from "./Demo";

interface Props {
  config: DemoConfig;
  setConfig: (update: (previous: DemoConfig) => DemoConfig) => void;
}

const FALLBACKS: { value: Fallback; label: string }[] = [
  { value: "system", label: "Follow the system setting" },
  { value: "time-based", label: "Go by the time of day" },
  { value: "light", label: "Always light" },
  { value: "dark", label: "Always dark" },
];

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Build the JSX a developer would paste, listing only non-default props. */
export function toSnippet(config: DemoConfig): string {
  const props: string[] = [];
  const d = DEFAULT_CONFIG;
  if (config.darkThreshold !== d.darkThreshold) props.push(`darkThreshold={${config.darkThreshold}}`);
  if (config.lightThreshold !== d.lightThreshold) props.push(`lightThreshold={${config.lightThreshold}}`);
  if (config.fallback !== d.fallback) props.push(`fallback="${config.fallback}"`);
  if (config.fallback === "time-based") {
    if (config.nightStart !== d.nightStart) props.push(`nightStart={${config.nightStart}}`);
    if (config.nightEnd !== d.nightEnd) props.push(`nightEnd={${config.nightEnd}}`);
  }
  if (config.switchDelay !== d.switchDelay) props.push(`switchDelay={${config.switchDelay}}`);

  const open = props.length
    ? `<AmbientLightThemeProvider\n${props.map((p) => `  ${p}`).join("\n")}\n>`
    : "<AmbientLightThemeProvider>";
  return `${open}\n  {children}\n</AmbientLightThemeProvider>`;
}

function NumberField(props: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <div className="field-number">
        <input
          id={props.id}
          type="number"
          inputMode="decimal"
          min={0}
          max={100000}
          value={props.value}
          aria-describedby={`${props.id}-hint`}
          onChange={(event) => {
            const value = Number(event.currentTarget.value);
            if (Number.isFinite(value) && value >= 0) props.onChange(value);
          }}
        />
        <span aria-hidden="true">lx</span>
      </div>
      <p className="field-hint" id={`${props.id}-hint`}>
        {props.hint}
      </p>
    </div>
  );
}

export function Configurator({ config, setConfig }: Props) {
  const set = <K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) =>
    setConfig((previous) => ({ ...previous, [key]: value }));
  const swapped = config.darkThreshold > config.lightThreshold;
  const isDefault = JSON.stringify(config) === JSON.stringify(DEFAULT_CONFIG);

  return (
    <div className="configurator">
      <form className="config-form" onSubmit={(event) => event.preventDefault()}>
        <NumberField
          id="cfg-dark"
          label="Dark below"
          hint="Readings under this switch to dark."
          value={config.darkThreshold}
          onChange={(v) => set("darkThreshold", v)}
        />
        <NumberField
          id="cfg-light"
          label="Light above"
          hint="Readings over this switch to light."
          value={config.lightThreshold}
          onChange={(v) => set("lightThreshold", v)}
        />
        {swapped && (
          <p className="field-warning" role="status">
            Dark is set higher than light. The provider will swap them.
          </p>
        )}

        <div className="field">
          <label htmlFor="cfg-fallback">Without a sensor</label>
          <select
            id="cfg-fallback"
            value={config.fallback}
            onChange={(event) => set("fallback", event.currentTarget.value as Fallback)}
          >
            {FALLBACKS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <p className="field-hint">
            Stop simulating at the top of the page to see the fallback.
          </p>
        </div>

        {config.fallback === "time-based" && (
          <div className="field-row">
            <div className="field">
              <label htmlFor="cfg-night-start">Dark from</label>
              <select
                id="cfg-night-start"
                value={config.nightStart}
                onChange={(event) => set("nightStart", Number(event.currentTarget.value))}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cfg-night-end">Until</label>
              <select
                id="cfg-night-end"
                value={config.nightEnd}
                onChange={(event) => set("nightEnd", Number(event.currentTarget.value))}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="cfg-delay">Switch delay</label>
          <input
            id="cfg-delay"
            type="range"
            min={0}
            max={5000}
            step={250}
            value={config.switchDelay}
            aria-describedby="cfg-delay-hint"
            aria-valuetext={`${config.switchDelay / 1000} seconds`}
            onChange={(event) => set("switchDelay", Number(event.currentTarget.value))}
          />
          <p className="field-hint" id="cfg-delay-hint">
            {(config.switchDelay / 1000).toFixed(2).replace(/0$/, "")} s. How long a
            real sensor has to keep reading dark or light before the theme
            changes, so a passing shadow doesn&apos;t flip it. Simulated
            readings switch straight away.
          </p>
        </div>

        <button
          type="button"
          className="text-button"
          disabled={isDefault}
          onClick={() => setConfig(() => DEFAULT_CONFIG)}
        >
          Reset to defaults
        </button>
      </form>

      <CodeBlock code={toSnippet(config)} label="provider snippet" language="tsx" />
    </div>
  );
}
