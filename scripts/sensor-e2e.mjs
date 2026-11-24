#!/usr/bin/env node
/**
 * End-to-end test of the real light-source code paths.
 *
 * 1. Light sensor: starts Chromium with the sensor API turned on, replaces the
 *    hardware with a virtual light sensor (Chrome DevTools Protocol), feeds it
 *    light levels, and checks that the demo page switches theme.
 * 2. Camera: replaces the webcam with a generated video (a covered camera, then
 *    a lit room), clicks "Use my camera", and checks the theme.
 *
 *   npm run build                # once, creates out/
 *   npx playwright install chromium   # once
 *   npm run test:sensor          # add -- --headed to watch it
 *
 * Chrome rounds illuminance to the nearest 50 lx for privacy, so readings
 * here are multiples of 50.
 */
import { createReadStream, existsSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(
  process.env.OUT_DIR ?? join(fileURLToPath(new URL(".", import.meta.url)), "..", "out"),
);
const HEADED = process.argv.includes("--headed");
const SWITCH_DELAY = 1000;
const SETTLE = SWITCH_DELAY + 800;

if (!existsSync(join(ROOT, "index.html"))) {
  console.error(`No build found in ${ROOT}. Run "npm run build" first.`);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

const server = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  let file = normalize(join(ROOT, url));
  if (!file.startsWith(ROOT + sep) && file !== ROOT) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const { port } = server.address();
const origin = `http://localhost:${port}`;

let failures = 0;
const results = [];

const read = (page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll(".check-list > div")];
    const row = (label) =>
      rows.find((r) => r.querySelector("dt")?.textContent === label)?.querySelector("dd")
        ?.textContent ?? "";
    return {
      theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
      reading: document.querySelector(".meter-value")?.textContent ?? "",
      source: row("Theme comes from"),
    };
  });

const record = (step, fed, expected, state, expectedSource) => {
  const ok = state.theme === expected && state.source === expectedSource;
  if (!ok) failures++;
  results.push({
    step,
    fed,
    expected,
    got: state.theme,
    "page shows": state.reading,
    "theme from": state.source,
    result: ok ? "PASS" : "FAIL",
  });
};

async function sensorTest() {
  const browser = await chromium.launch({
    headless: !HEADED,
    slowMo: HEADED ? 150 : 0,
    args: ["--enable-features=GenericSensorExtraClasses"],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    await context.grantPermissions(["ambient-light-sensor"], { origin });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setSensorOverrideEnabled", { enabled: true, type: "ambient-light" });
    const setLight = (lux) =>
      cdp.send("Emulation.setSensorOverrideReadings", {
        type: "ambient-light",
        reading: { single: { value: lux } },
      });
    const check = async (step, lux, expected, wait = SETTLE) => {
      if (lux !== null) await setLight(lux);
      await page.waitForTimeout(wait);
      record(`Sensor: ${step}`, lux === null ? "" : `${lux} lx`, expected, await read(page), "Light sensor");
    };

    await setLight(1000);
    await page.goto(`${origin}/`);
    await check("bright room on load", null, "light");
    await check("lights off", 0, "dark");
    await check("dim lamp, inside the hold zone", 50, "dark");
    await check("daylight", 1000, "light");
    await check("dim lamp again, stays light", 50, "light");
    // A hand passes over the sensor: during the shadow the theme must hold,
    // and once the light is back it must not have switched.
    await check("hand over the sensor (0.4 s in)", 0, "light", 400);
    await check("hand moves away, never switched", 1000, "light");
    if (HEADED) await page.waitForTimeout(1500);
  } finally {
    await browser.close();
  }
}

/** A tiny Y4M video of one flat grey level (16 = black, 235 = white). */
function makeVideo(dir, name, luma) {
  const w = 64;
  const h = 48;
  const frame = Buffer.concat([
    Buffer.from("FRAME\n"),
    Buffer.alloc(w * h, luma),
    Buffer.alloc((w * h) / 2, 128),
  ]);
  const file = join(dir, `${name}.y4m`);
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from(`YUV4MPEG2 W${w} H${h} F10:1 Ip A1:1 C420jpeg\n`),
      ...Array.from({ length: 20 }, () => frame),
    ]),
  );
  return file;
}

async function cameraTest(step, video, expected) {
  const browser = await chromium.launch({
    headless: !HEADED,
    slowMo: HEADED ? 150 : 0,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${video}`,
    ],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    await context.grantPermissions(["camera"], { origin });
    const page = await context.newPage();
    await page.goto(`${origin}/`);
    await page.getByRole("button", { name: "Use my camera as a light meter" }).click();
    await page.waitForTimeout(SETTLE + 1500);
    record(`Camera: ${step}`, "", expected, await read(page), "Camera brightness");
    if (HEADED) await page.waitForTimeout(1500);
  } finally {
    await browser.close();
  }
}

try {
  await sensorTest();
  const dir = mkdtempSync(join(tmpdir(), "ambient-e2e-"));
  await cameraTest("lens covered", makeVideo(dir, "covered", 16), "dark");
  await cameraTest("normal room light", makeVideo(dir, "room", 150), "light");
} catch (error) {
  failures++;
  console.error(error);
} finally {
  server.close();
}

console.table(results);

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll checks passed: the light sensor and camera paths both work.");
