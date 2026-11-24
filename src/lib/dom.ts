import { DEFAULTS } from "./core";
import type { Fallback, Theme, ThemeAttribute } from "./types";

/** Write the theme onto `<html>` and set `color-scheme` for native UI. */
export function applyThemeToDocument(
  theme: Theme,
  attribute: ThemeAttribute,
): void {
  if (!attribute || typeof document === "undefined") return;
  const root = document.documentElement;
  if (attribute === "class") {
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);
  } else {
    root.setAttribute(attribute, theme);
  }
  root.style.colorScheme = theme;
}

export interface ThemeScriptOptions {
  fallback?: Fallback;
  attribute?: ThemeAttribute;
  storageKey?: string | null;
  nightStart?: number;
  nightEnd?: number;
}

/**
 * Inline script that sets the theme before first paint, so server-rendered
 * pages don't flash the wrong theme. It applies the stored manual override
 * or the fallback; the provider takes over once React hydrates.
 */
export function getThemeScript(options: ThemeScriptOptions = {}): string {
  const config = {
    k: options.storageKey === undefined ? DEFAULTS.storageKey : options.storageKey,
    f: options.fallback ?? "system",
    a: options.attribute === undefined ? "class" : options.attribute,
    s: options.nightStart ?? DEFAULTS.nightStart,
    e: options.nightEnd ?? DEFAULTS.nightEnd,
  };
  // Keep in sync with isNightHour() and applyThemeToDocument().
  return `(function(c){try{var m=null;try{m=c.k&&localStorage.getItem(c.k)}catch(_){}var t;if(m==="light"||m==="dark"){t=m}else if(c.f==="light"||c.f==="dark"){t=c.f}else if(c.f==="time-based"){var h=new Date().getHours();var n=c.s===c.e?false:c.s>c.e?(h>=c.s||h<c.e):(h>=c.s&&h<c.e);t=n?"dark":"light"}else{t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(!c.a)return;var d=document.documentElement;if(c.a==="class"){d.classList.remove(t==="dark"?"light":"dark");d.classList.add(t)}else{d.setAttribute(c.a,t)}d.style.colorScheme=t}catch(_){}})(${JSON.stringify(
    config,
  ).replace(/</g, "\\u003c")})`;
}
