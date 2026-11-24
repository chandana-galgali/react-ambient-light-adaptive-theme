/**
 * Camera light meter: estimates how bright the surroundings are from the
 * average brightness of camera frames. Works in any browser with camera
 * access (including Safari on iPhone), over HTTPS or on localhost.
 *
 * It measures relative brightness (0–1), not lux: cameras adjust their own
 * exposure, so a dim room and a bright room can look similar. What it does
 * detect reliably is a covered camera or a genuinely dark room.
 *
 * Frames are reduced to one number in memory and never stored or sent.
 */
import type { SensorFailure } from "./sensor";

const SAMPLE_WIDTH = 32;
const SAMPLE_HEIGHT = 24;

/** True when the browser can open a camera here (needs a secure context). Safe during SSR. */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

/**
 * Average perceived brightness (Rec. 709 luma) of RGBA pixel data, 0–1.
 * Ignores the alpha channel.
 */
export function meanBrightness(rgba: ArrayLike<number>): number {
  const pixels = Math.floor(rgba.length / 4);
  if (pixels === 0) return 0;
  let total = 0;
  for (let i = 0; i < pixels * 4; i += 4) {
    total += 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
  }
  return Math.min(Math.max(total / pixels / 255, 0), 1);
}

function failureFromError(error: unknown): SensorFailure {
  const name = (error as { name?: string } | null)?.name;
  return name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error";
}

/**
 * Open the camera and report brightness (0–1) every `interval` ms.
 * Returns a stop function that releases the camera. Never throws.
 */
export function startCameraLightMeter(options: {
  /** Milliseconds between samples. Default 500. */
  interval?: number;
  /** `"user"` (front, default) or `"environment"` (back). */
  facingMode?: "user" | "environment";
  onReading: (brightness: number) => void;
  onError: (reason: SensorFailure) => void;
}): () => void {
  const { interval = 500, facingMode = "user", onReading, onError } = options;
  let stopped = false;
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;

  const release = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) {
      video.srcObject = null;
      video.remove();
      video = null;
    }
  };

  if (!isCameraSupported()) {
    onError("error");
    return () => {};
  }

  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: { facingMode, width: { ideal: 320 }, height: { ideal: 240 } },
    })
    .then(async (media) => {
      if (stopped) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = media;
      const element = document.createElement("video");
      element.muted = true;
      element.playsInline = true;
      element.setAttribute("playsinline", "");
      element.setAttribute("aria-hidden", "true");
      // Some mobile browsers only decode frames for videos in the document.
      element.style.cssText =
        "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;";
      document.body.appendChild(element);
      video = element;
      element.srcObject = media;
      await element.play();
      if (stopped || !context) {
        if (!context) onError("error");
        release();
        return;
      }

      const sample = () => {
        if (stopped || !video || video.readyState < 2) return;
        context.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        onReading(meanBrightness(data));
      };
      sample();
      timer = setInterval(sample, interval);

      // The camera was unplugged, or another app took it.
      media.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (!stopped) onError("error");
      });
    })
    .catch((error) => {
      if (stopped) return;
      release();
      onError(failureFromError(error));
    });

  return () => {
    stopped = true;
    release();
  };
}
