"use client";

import { useEffect, useState } from "react";
import {
  isAmbientLightSensorSupported,
  isCameraSupported,
  queryAmbientLightPermission,
  themeFromTime,
  useAmbientTheme,
  type SensorStatus,
} from "@/lib";
import type { DemoConfig } from "./Demo";

interface Props {
  lux: number | null;
  setLux: (lux: number | null) => void;
  config: DemoConfig;
}

interface Capabilities {
  supported: boolean;
  camera: boolean;
  permission: PermissionState | "n/a";
  secure: boolean;
  prefersDark: boolean;
}

const SENSOR_TEXT: Record<SensorStatus, string> = {
  idle: "Not started",
  unsupported: "Not available in this browser",
  pending: "Waiting for the first reading",
  active: "Reading live",
  denied: "Permission denied",
  error: "Couldn't start the sensor",
  simulated: "Paused while you simulate",
};

const SOURCE_TEXT: Record<string, string> = {
  sensor: "Light sensor",
  camera: "Camera brightness",
  simulated: "Simulated reading",
  system: "System setting",
  time: "Time of day",
  static: "Fixed fallback",
  manual: "Manual choice",
};

const pad = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export function BrowserCheck({ lux, setLux, config }: Props) {
  const { source, sensorStatus, lightSource } = useAmbientTheme();
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    const supported = isAmbientLightSensorSupported();
    const update = (permission: Capabilities["permission"]) => {
      if (cancelled) return;
      setCaps({
        supported,
        camera: isCameraSupported(),
        permission,
        secure: window.isSecureContext,
        prefersDark: query?.matches ?? false,
      });
    };
    update("n/a");
    if (supported) void queryAmbientLightPermission().then(update);
    const onChange = () =>
      setCaps((c) => (c ? { ...c, prefersDark: query?.matches ?? false } : c));
    query?.addEventListener?.("change", onChange);
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      cancelled = true;
      query?.removeEventListener?.("change", onChange);
      window.clearInterval(id);
    };
  }, []);

  const timeTheme = now ? themeFromTime(now, config.nightStart, config.nightEnd) : null;

  const rows: { label: string; value: string; ok?: boolean }[] = caps
    ? [
        {
          label: "AmbientLightSensor",
          value: caps.supported ? "Available" : "Not available",
          ok: caps.supported,
        },
        {
          label: "Camera access",
          value: caps.camera ? "Available" : caps.secure ? "Not available" : "Needs HTTPS",
          ok: caps.camera,
        },
        {
          label: lightSource === "camera" ? "Camera" : "Sensor",
          value: SENSOR_TEXT[sensorStatus],
          ok: sensorStatus === "active" ? true : undefined,
        },
        {
          label: "Sensor permission",
          value: caps.permission === "n/a" ? "Not applicable" : caps.permission,
          ok: caps.permission === "granted" ? true : caps.permission === "denied" ? false : undefined,
        },
        { label: "Secure context (HTTPS)", value: caps.secure ? "Yes" : "No", ok: caps.secure },
        { label: "System setting", value: caps.prefersDark ? "Dark" : "Light" },
        {
          label: "Time of day",
          value: timeTheme
            ? `${timeTheme === "dark" ? "Night" : "Day"} (dark ${pad(config.nightStart)} to ${pad(config.nightEnd)})`
            : "Checking",
        },
        { label: "Theme comes from", value: SOURCE_TEXT[source] ?? source },
      ]
    : [];

  return (
    <div className="check">
      {caps ? (
        <dl className="check-list">
          {rows.map((row) => (
            <div key={row.label} data-ok={row.ok === undefined ? undefined : String(row.ok)}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="check-loading">Checking your browser…</p>
      )}

      {caps?.supported && lux !== null && (
        <button type="button" className="button" onClick={() => setLux(null)}>
          Use my real sensor
        </button>
      )}
      {caps && !caps.supported && (
        <p className="check-hint">
          To try a real sensor, use Chrome or Edge on an Android phone or on a
          laptop with auto-brightness. Turn on{" "}
          <code>chrome://flags/#enable-generic-sensor-extra-classes</code> (in
          Edge, <code>edge://flags</code>), restart the browser, and reload.
          Safari, every browser on iPhone, and Firefox don&apos;t support it.
        </p>
      )}
    </div>
  );
}
