import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AmbientLightThemeProvider,
  useAmbientTheme,
} from "../src/lib/AmbientLightThemeProvider";
import { AmbientThemeScript } from "../src/lib/script";

function Probe() {
  const { theme, source, sensorStatus, mode } = useAmbientTheme();
  return createElement("output", null, `${theme}|${source}|${sensorStatus}|${mode}`);
}

describe("AmbientLightThemeProvider (server render)", () => {
  it("renders children with a stable default state", () => {
    const html = renderToStaticMarkup(
      createElement(AmbientLightThemeProvider, null, createElement(Probe)),
    );
    assert.equal(html, "<output>light|system|idle|auto</output>");
  });

  it("starts from a static dark fallback", () => {
    const html = renderToStaticMarkup(
      createElement(AmbientLightThemeProvider, { fallback: "dark" }, createElement(Probe)),
    );
    assert.equal(html, "<output>dark|static|idle|auto</output>");
  });

  it("respects defaultMode", () => {
    const html = renderToStaticMarkup(
      createElement(AmbientLightThemeProvider, { defaultMode: "dark" }, createElement(Probe)),
    );
    assert.equal(html, "<output>dark|manual|idle|dark</output>");
  });

  it("throws a clear error outside the provider", () => {
    assert.throws(
      () => renderToStaticMarkup(createElement(Probe)),
      /within an <AmbientLightThemeProvider>/,
    );
  });
});

describe("AmbientThemeScript", () => {
  it("renders an inline script", () => {
    const html = renderToStaticMarkup(createElement(AmbientThemeScript, { nonce: "abc" }));
    assert.match(html, /^<script nonce="abc">\(function\(c\)/);
  });
});
