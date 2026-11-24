# Contributing

Thanks for helping out. Bug reports, ideas and pull requests are all welcome.

## Setup

```bash
git clone https://github.com/chandana-galgali/react-ambient-light-adaptive-theme.git
cd react-ambient-light-adaptive-theme
npm install
npm run dev
```

The demo site runs at http://localhost:3000 and uses the library straight from `src/lib`, so changes show up immediately.

## Before opening a pull request

```bash
npm run check        # lint, typecheck and unit tests
npm run build:lib    # make sure the package still builds
npm run build && npm run test:sensor   # end-to-end sensor test
```

- Keep decision logic in `src/lib/core.ts` as pure functions, and add tests for it in `tests/`.
- Anything that touches `window` or `document` must be safe to import during server rendering.
- If you change the time-based rule or how the theme is applied, update `getThemeScript()` in `src/lib/dom.ts` too. `tests/script.test.ts` checks that the two agree.
- Add a line to `CHANGELOG.md` under an "Unreleased" heading.

## Testing the real sensor

Without hardware, run the virtual-sensor test:

```bash
npm run build
npx playwright install chromium   # once
npm run test:sensor -- --headed
```

To try real hardware on a phone:

1. Run `npm run dev -- --hostname 0.0.0.0` and open the page over HTTPS (for example with a tunnel such as `ngrok`), since sensors require a secure context.
2. In Chrome on Android, turn on `chrome://flags/#enable-generic-sensor-extra-classes` and restart the browser.
3. Open the demo, press **Stop simulating**, and cover the light sensor near the front camera.

## Releasing

1. Bump `version` in `package.json` and date the changelog entry.
2. `npm publish` (runs the tests and builds `dist/` first).
3. Tag the release: `git tag vX.Y.Z && git push --tags`.
