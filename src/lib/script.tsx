// Server-safe entry: no hooks, no "use client". Import from
// "react-ambient-light-adaptive-theme/script" in a server layout.
import { getThemeScript, type ThemeScriptOptions } from "./dom";

export { getThemeScript };
export type { ThemeScriptOptions };

export interface AmbientThemeScriptProps extends ThemeScriptOptions {
  /** CSP nonce, if your site uses one. */
  nonce?: string;
}

/**
 * Sets the theme before first paint so server-rendered pages don't flash.
 * Put it in `<head>`, add `suppressHydrationWarning` to `<html>`, and pass
 * the same `fallback`, `attribute`, `storageKey` and night hours as the provider.
 */
export function AmbientThemeScript({ nonce, ...options }: AmbientThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      // Generated from serialized options only; safe to inline.
      dangerouslySetInnerHTML={{ __html: getThemeScript(options) }}
    />
  );
}

export default AmbientThemeScript;
