import { CodeBlock } from "./CodeBlock";
import { GITHUB_URL, PACKAGE_NAME } from "./site";

const LAYOUT = `import { AmbientLightThemeProvider } from "${PACKAGE_NAME}";
import { AmbientThemeScript } from "${PACKAGE_NAME}/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <AmbientThemeScript />
      </head>
      <body>
        <AmbientLightThemeProvider>{children}</AmbientLightThemeProvider>
      </body>
    </html>
  );
}`;

const CSS = `:root,
.light {
  --background: #ffffff;
  --foreground: #171717;
}

.dark {
  --background: #0f1622;
  --foreground: #e3e8ee;
}

/* Tailwind CSS v4: make dark: follow the class */
@custom-variant dark (&:where(.dark, .dark *));`;

const HOOK = `import { useAmbientTheme } from "${PACKAGE_NAME}";

function ThemeBadge() {
  const { theme, source, illuminance, setMode } = useAmbientTheme();
  return (
    <button onClick={() => setMode(theme === "dark" ? "light" : "dark")}>
      {theme} from {source}
      {illuminance !== null && \` (\${Math.round(illuminance)} lx)\`}
    </button>
  );
}`;

const PROPS: [string, string, string, string][] = [
  ["lightSource", `"sensor" | "camera"`, `"sensor"`, "Measure light with the ambient light sensor or the camera. The camera asks for permission when this is set."],
  ["fallback", `"system" | "time-based" | "light" | "dark"`, `"system"`, "What to use when there's no light reading."],
  ["darkThreshold", "number", "30", "Go dark below this many lux."],
  ["lightThreshold", "number", "60", "Go light above this many lux. In between, the theme stays as it is."],
  ["switchDelay", "number", "1000", "Milliseconds the sensor must keep pointing to the other theme before switching."],
  ["frequency", "number", "1", "Sensor readings per second."],
  ["cameraDarkThreshold", "number", "0.12", "Camera mode: go dark below this brightness (0 to 1)."],
  ["cameraLightThreshold", "number", "0.2", "Camera mode: go light above this brightness (0 to 1)."],
  ["cameraInterval", "number", "500", "Camera mode: milliseconds between samples."],
  ["cameraFacingMode", `"user" | "environment"`, `"user"`, "Camera mode: front or back camera."],
  ["nightStart", "number", "19", "Hour the time-based fallback turns dark."],
  ["nightEnd", "number", "7", "Hour it turns light again."],
  ["attribute", `"class" | "data-*" | null`, `"class"`, "Where to write the theme on <html>. null leaves the DOM alone."],
  ["storageKey", "string | null", `"ambient-theme-mode"`, "Where a manual choice is remembered. null to not remember it."],
  ["defaultMode", `"auto" | "light" | "dark"`, `"auto"`, "Mode before the user picks one."],
  ["disableSensor", "boolean", "false", "Skip the sensor or camera and use only the fallback."],
  ["simulatedIlluminance", "number | null", "null", "Feed a lux value yourself, for demos and tests."],
  ["onThemeChange", "(theme, source) => void", "", "Called when the theme or its source changes."],
];

const VALUES: [string, string, string][] = [
  ["theme", `"light" | "dark"`, "The theme in use."],
  ["isDarkMode", "boolean", "Shorthand for theme === \"dark\"."],
  ["source", `"sensor" | "camera" | "simulated" | "system" | "time" | "static" | "manual"`, "Why this theme was picked."],
  ["illuminance", "number | null", "Latest sensor reading in lux."],
  ["brightness", "number | null", "Latest camera brightness, 0 to 1."],
  ["lightSource", `"sensor" | "camera"`, "The light source in use."],
  ["sensorStatus", `"idle" | "unsupported" | "pending" | "active" | "denied" | "error" | "simulated"`, "What the sensor or camera is doing."],
  ["mode", `"auto" | "light" | "dark"`, "Auto, or the user's manual choice."],
  ["setMode", "(mode) => void", "Change the mode. Remembered between visits."],
  ["toggleTheme", "() => void", "Switch to the opposite theme as a manual choice."],
];

export function Docs() {
  return (
    <>
      <section className="docs" id="start" aria-labelledby="start-title">
        <h2 id="start-title">Get started</h2>
        <ol className="steps">
          <li>
            <h3>Install the package</h3>
            <CodeBlock code={`npm install ${PACKAGE_NAME}`} label="install command" language="sh" />
          </li>
          <li>
            <h3>Wrap your app</h3>
            <p>
              The script sets the theme before the first paint, so there&apos;s
              no flash on load. In plain React, skip the script and wrap your
              root component.
            </p>
            <CodeBlock code={LAYOUT} label="layout example" language="tsx" />
          </li>
          <li>
            <h3>Style both themes</h3>
            <p>
              The provider adds <code>light</code> or <code>dark</code> to{" "}
              <code>&lt;html&gt;</code> and sets <code>color-scheme</code> so
              scrollbars and form controls match.
            </p>
            <CodeBlock code={CSS} label="CSS example" language="css" />
          </li>
          <li>
            <h3>Read the theme anywhere</h3>
            <CodeBlock code={HOOK} label="hook example" language="tsx" />
          </li>
        </ol>
      </section>

      <section className="docs" id="api" aria-labelledby="api-title">
        <h2 id="api-title">API</h2>
        <h3>
          <code>&lt;AmbientLightThemeProvider&gt;</code> props
        </h3>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Provider props">
          <table>
            <thead>
              <tr>
                <th scope="col">Prop</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
                <th scope="col">What it does</th>
              </tr>
            </thead>
            <tbody>
              {PROPS.map(([name, type, def, desc]) => (
                <tr key={name}>
                  <th scope="row"><code>{name}</code></th>
                  <td><code>{type}</code></td>
                  <td>{def ? <code>{def}</code> : "None"}</td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>
          <code>useAmbientTheme()</code> returns
        </h3>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Hook return values">
          <table>
            <thead>
              <tr>
                <th scope="col">Value</th>
                <th scope="col">Type</th>
                <th scope="col">What it is</th>
              </tr>
            </thead>
            <tbody>
              {VALUES.map(([name, type, desc]) => (
                <tr key={name}>
                  <th scope="row"><code>{name}</code></th>
                  <td><code>{type}</code></td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The pure helpers (<code>classifyIlluminance</code>,{" "}
          <code>themeFromTime</code>, <code>startAmbientLightSensor</code> and
          others) are exported too. See the{" "}
          <a href={`${GITHUB_URL}#readme`}>README</a> for the full list.
        </p>
      </section>
    </>
  );
}
