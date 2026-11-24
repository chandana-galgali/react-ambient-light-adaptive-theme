#!/usr/bin/env node
/**
 * End-to-end test of the real AmbientLightSensor code path.
 *
 * Starts Chromium with the sensor API turned on, replaces the hardware with a
 * virtual light sensor (Chrome DevTools Protocol), feeds it light levels, and
 * checks that the demo page switches theme the way it should.
 *
 *   npm run build                # once, creates out/
 *   npx playwright install chromium   # once
 *   npm run test:sensor          # add -- --headed to watch it
 *
 * Chrome rounds illuminance to the nearest 50 lx for privacy, so readings
 * here are multiples of 50.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
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

const browser = await chromium.launch({
  headless: !HEADED,
  slowMo: HEADED ? 150 : 0,
  args: ["--enable-features=GenericSensorExtraClasses"],
});

let failures = 0;
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

  const read = () =>
    page.evaluate(() => {
      const rows = [...document.querySelectorAll(".check-list > div")];
      const row = (label) =>
        rows.find((r) => r.querySelector("dt")?.textContent === label)?.querySelector("dd")
          ?.textContent ?? "";
      return {
        theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        reading: document.querySelector(".meter-value")?.textContent ?? "",
        sensor: row("Sensor"),
        source: row("Theme comes from"),
      };
    });

  const results = [];
  const check = async (step, lux, expected, wait = SETTLE) => {
    if (lux !== null) await setLight(lux);
    await page.waitForTimeout(wait);
    const state = await read();
    const ok = state.theme === expected && state.source === "Light sensor";
    if (!ok) failures++;
    results.push({
      step,
      "fed (lx)": lux ?? "",
      expected,
      got: state.theme,
      "page shows": state.reading,
      "theme from": state.source,
      result: ok ? "PASS" : "FAIL",
    });
  };

  await setLight(1000);
  await page.goto(`${origin}/`);
  await check("Bright room on load", null, "light");
  await check("Lights off", 0, "dark");
  await check("Dim lamp, inside the hold zone", 50, "dark");
  await check("Daylight", 1000, "light");
  await check("Dim lamp again, stays light", 50, "light");

  // A hand passes over the sensor: during the shadow the theme must hold,
  // and once the light is back it must not have switched.
  await check("Hand over the sensor (0.4 s in)", 0, "light", 400);
  await check("Hand moves away, never switched", 1000, "light");

  await page.evaluate(() => window.scrollTo(0, 0));
  if (HEADED) await page.waitForTimeout(1500);

  console.table(results);
  const status = await read();
  console.log(`Sensor status on the page: "${status.sensor}"`);
} catch (error) {
  failures++;
  console.error(error);
} finally {
  await browser.close();
  server.close();
}

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll sensor checks passed: the real AmbientLightSensor path works.");
