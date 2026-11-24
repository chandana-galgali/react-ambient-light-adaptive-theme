import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getThemeScript } from "../src/lib/dom";

/** Run the inline script against a minimal fake browser. */
function run(
  options: Parameters<typeof getThemeScript>[0],
  env: { stored?: string | null; prefersDark?: boolean; hour?: number } = {},
) {
  const classes = new Set<string>(["light"]);
  const attrs: Record<string, string> = {};
  const root = {
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
    },
    setAttribute: (k: string, v: string) => (attrs[k] = v),
    style: { colorScheme: "" },
  };
  const RealDate = Date;
  class FakeDate extends RealDate {
    getHours() {
      return env.hour ?? 12;
    }
  }
  const sandbox = {
    document: { documentElement: root },
    localStorage: { getItem: () => env.stored ?? null },
    window: {
      matchMedia: () => ({ matches: env.prefersDark ?? false }),
    },
    Date: FakeDate,
  };
  new Function(
    "document",
    "localStorage",
    "window",
    "Date",
    getThemeScript(options),
  )(sandbox.document, sandbox.localStorage, sandbox.window, sandbox.Date);
  return { classes: [...classes], attrs, colorScheme: root.style.colorScheme };
}

describe("getThemeScript", () => {
  it("follows the system preference by default", () => {
    assert.deepEqual(run({}, { prefersDark: true }).classes, ["dark"]);
    assert.deepEqual(run({}, { prefersDark: false }).classes, ["light"]);
  });

  it("applies a stored manual override first", () => {
    const result = run({}, { stored: "dark", prefersDark: false });
    assert.deepEqual(result.classes, ["dark"]);
    assert.equal(result.colorScheme, "dark");
  });

  it("ignores a stored 'auto'", () => {
    assert.deepEqual(run({}, { stored: "auto", prefersDark: true }).classes, ["dark"]);
  });

  it("matches the time-based rule", () => {
    assert.deepEqual(run({ fallback: "time-based" }, { hour: 22 }).classes, ["dark"]);
    assert.deepEqual(run({ fallback: "time-based" }, { hour: 9 }).classes, ["light"]);
    assert.deepEqual(
      run({ fallback: "time-based", nightStart: 1, nightEnd: 5 }, { hour: 22 }).classes,
      ["light"],
    );
  });

  it("can write a data attribute instead of a class", () => {
    const result = run({ attribute: "data-theme" }, { prefersDark: true });
    assert.equal(result.attrs["data-theme"], "dark");
  });

  it("escapes the serialized config", () => {
    assert.ok(!getThemeScript({ storageKey: "</script>" }).includes("</script>"));
  });
});
