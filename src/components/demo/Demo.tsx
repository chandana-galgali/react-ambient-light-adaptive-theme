"use client";

import { useState } from "react";
import { AmbientLightThemeProvider, DEFAULTS, type Fallback } from "@/lib";
import { BrowserCheck } from "./BrowserCheck";
import { Configurator } from "./Configurator";
import { Docs } from "./Docs";
import { LuxMeter } from "./LuxMeter";
import { ModeSwitch } from "./ModeSwitch";
import { ReadingsChart } from "./ReadingsChart";
import { GITHUB_URL, NPM_URL, STORAGE_KEY } from "./site";

export interface DemoConfig {
  darkThreshold: number;
  lightThreshold: number;
  fallback: Fallback;
  nightStart: number;
  nightEnd: number;
  switchDelay: number;
}

export const DEFAULT_CONFIG: DemoConfig = {
  darkThreshold: DEFAULTS.darkThreshold,
  lightThreshold: DEFAULTS.lightThreshold,
  fallback: "system",
  nightStart: DEFAULTS.nightStart,
  nightEnd: DEFAULTS.nightEnd,
  switchDelay: DEFAULTS.switchDelay,
};

export default function Demo() {
  const [lux, setLux] = useState<number | null>(null);
  const [config, setConfig] = useState<DemoConfig>(DEFAULT_CONFIG);

  return (
    <AmbientLightThemeProvider
      {...config}
      storageKey={STORAGE_KEY}
      simulatedIlluminance={lux}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Ambient light theme, back to top">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="13" />
            <path d="M16 3a13 13 0 0 1 0 26z" />
          </svg>
          <span>ambient light theme</span>
        </a>
        <nav className="site-nav" aria-label="Project links">
          <a href="#start">Docs</a>
          <a href={GITHUB_URL}>GitHub</a>
          <a href={NPM_URL}>npm</a>
        </nav>
        <ModeSwitch />
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <h1 id="hero-title">Themes that read the room.</h1>
          <p className="lede">
            A React provider that picks light or dark from how bright it
            actually is around your user, using the device&apos;s ambient light
            sensor. Where the browser can&apos;t measure light, it falls back to
            the system setting or the time of day.
          </p>
          <LuxMeter lux={lux} setLux={setLux} config={config} />
        </section>

        <section className="band" aria-labelledby="hysteresis-title">
          <div className="band-text">
            <h2 id="hysteresis-title">Why it doesn&apos;t flicker</h2>
            <p>
              Light sensors are noisy. A lamp flickering or a hand passing over
              the phone would flip a single cut-off back and forth. Instead
              there are two thresholds: it turns dark below{" "}
              <strong>{config.darkThreshold}&nbsp;lx</strong>, light above{" "}
              <strong>{config.lightThreshold}&nbsp;lx</strong>, and in between
              it keeps whatever it was.
            </p>
            <p>
              Try it: pick <em>Office</em>, then <em>Living room</em>. It stays
              light. Now pick <em>Civil twilight</em>, then <em>Living
              room</em> again. It stays dark.
            </p>
          </div>
          <ReadingsChart lux={lux} config={config} />
        </section>

        <section className="band" aria-labelledby="browser-title">
          <div className="band-text">
            <h2 id="browser-title">What your browser can do</h2>
            <p>
              <code>AmbientLightSensor</code> is still experimental. Chrome on
              Android has it behind a flag, and most desktop browsers don&apos;t
              have it at all. The provider checks for it, asks for permission,
              and uses the fallback whenever it can&apos;t get a reading.
            </p>
          </div>
          <BrowserCheck lux={lux} setLux={setLux} config={config} />
        </section>

        <section className="band band-wide" aria-labelledby="configure-title">
          <div className="band-text">
            <h2 id="configure-title">Tune it for your app</h2>
            <p>
              Changes apply to this page straight away, and the snippet
              underneath updates to match.
            </p>
          </div>
          <Configurator config={config} setConfig={setConfig} />
        </section>

        <Docs />
      </main>

      <footer className="site-footer">
        <p>
          MIT licensed. Made by{" "}
          <a href="https://github.com/chandana-galgali">Chandana Galgali</a>.
        </p>
        <p>
          <a href={GITHUB_URL}>Source on GitHub</a>
          <a href={`${GITHUB_URL}/issues`}>Report an issue</a>
        </p>
      </footer>
    </AmbientLightThemeProvider>
  );
}
