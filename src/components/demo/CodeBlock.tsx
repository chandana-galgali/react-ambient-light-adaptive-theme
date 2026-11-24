"use client";

import { useEffect, useState } from "react";

interface Props {
  code: string;
  /** Short name for the copy button, e.g. "install command". */
  label?: string;
  language?: string;
}

export function CodeBlock({ code, label = "code", language }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="code" data-language={language}>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
      <button type="button" className="code-copy" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="visually-hidden" aria-live="polite">
        {copied ? `Copied ${label}` : ""}
      </span>
    </div>
  );
}
