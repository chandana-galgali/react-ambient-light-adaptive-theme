/**
 * Thin wrapper around the experimental Generic Sensor `AmbientLightSensor`.
 * https://w3c.github.io/ambient-light/
 *
 * Note: the reading lives on the sensor object (`sensor.illuminance`),
 * not on the `reading` event.
 */

interface AmbientLightSensorInstance extends EventTarget {
  readonly illuminance?: number | null;
  start(): void;
  stop(): void;
}

type AmbientLightSensorConstructor = new (options?: {
  frequency?: number;
}) => AmbientLightSensorInstance;

type WindowWithSensor = Window & {
  AmbientLightSensor?: AmbientLightSensorConstructor;
};

export type SensorFailure = "denied" | "error";

/** True when the browser exposes `AmbientLightSensor`. Safe to call during SSR. */
export function isAmbientLightSensorSupported(): boolean {
  return typeof window !== "undefined" && "AmbientLightSensor" in window;
}

/** Query the `ambient-light-sensor` permission. Resolves to "prompt" when unknown. */
export async function queryAmbientLightPermission(): Promise<PermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "prompt";
  }
  try {
    const status = await navigator.permissions.query({
      name: "ambient-light-sensor" as PermissionName,
    });
    return status.state;
  } catch {
    return "prompt";
  }
}

function failureFromName(name: string | undefined): SensorFailure {
  return name === "NotAllowedError" || name === "SecurityError"
    ? "denied"
    : "error";
}

/**
 * Start the sensor and stream readings (in lux). Returns a stop function.
 * Never throws: failures are reported through `onError`.
 */
export function startAmbientLightSensor(options: {
  frequency?: number;
  onReading: (lux: number) => void;
  onError: (reason: SensorFailure) => void;
}): () => void {
  const { frequency = 1, onReading, onError } = options;
  let stopped = false;
  let sensor: AmbientLightSensorInstance | null = null;

  const Ctor = isAmbientLightSensorSupported()
    ? (window as WindowWithSensor).AmbientLightSensor
    : undefined;

  if (!Ctor) {
    onError("error");
    return () => {};
  }

  const begin = () => {
    if (stopped) return;
    try {
      const instance = new Ctor({ frequency });
      sensor = instance;
      instance.addEventListener("reading", () => {
        const lux = instance.illuminance;
        if (!stopped && typeof lux === "number" && Number.isFinite(lux)) {
          onReading(lux);
        }
      });
      instance.addEventListener("error", (event) => {
        if (stopped) return;
        const error = (event as Event & { error?: { name?: string } }).error;
        onError(failureFromName(error?.name));
      });
      instance.start();
    } catch (error) {
      onError(failureFromName((error as { name?: string } | null)?.name));
    }
  };

  void queryAmbientLightPermission().then((state) => {
    if (stopped) return;
    if (state === "denied") onError("denied");
    else begin();
  });

  return () => {
    stopped = true;
    try {
      sensor?.stop();
    } catch {
      // Sensor already stopped or never started.
    }
  };
}
