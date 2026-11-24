"use client";

import { useAmbientTheme, type ThemeMode } from "@/lib";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ModeSwitch() {
  const { mode, setMode } = useAmbientTheme();
  return (
    <fieldset className="mode-switch">
      <legend className="visually-hidden">Theme</legend>
      {OPTIONS.map((option) => (
        <label key={option.value} data-checked={mode === option.value || undefined}>
          <input
            type="radio"
            name="theme-mode"
            value={option.value}
            checked={mode === option.value}
            onChange={() => setMode(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
