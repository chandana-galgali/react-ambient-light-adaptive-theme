"use client";
import React, { useState, useEffect, ReactNode } from "react";

interface AmbientLightSensorEvent extends Event {
  illuminance: number;
}

declare global {
  interface Window {
    AmbientLightSensor: {
      new(): AmbientLightSensor;
    };
  }
}

interface AmbientLightSensor {
  onreading: (event: AmbientLightSensorEvent) => void;
  onerror: (event: Event) => void;
  start: () => void;
  stop: () => void;
}

interface AmbientLightThemeProviderProps {
  children: ReactNode;
  fallback?: "system" | "time-based";
}

const AmbientLightThemeProvider: React.FC<
  AmbientLightThemeProviderProps
> = ({ children, fallback = "system" }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    let sensor: AmbientLightSensor | undefined;

    const applyFallbackTheme = () => {
      if (fallback === "system") {
        const isSystemDarkMode =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDarkMode(isSystemDarkMode);
      } else if (fallback === "time-based") {
        const currentHour = new Date().getHours();
        setIsDarkMode(currentHour >= 19 || currentHour <= 6);
      }
    };

    if ("AmbientLightSensor" in window) {
      try {
        sensor = new window.AmbientLightSensor();
        sensor.onreading = (event) => {
          const lightLevel = event.illuminance;
          setIsDarkMode(lightLevel < 50);
        };
        sensor.onerror = (event) => {
          console.error("Ambient Light Sensor error:", event);
          applyFallbackTheme();
        };
        sensor.start();
      } catch (error) {
        console.error("Ambient Light Sensor not available:", error);
        applyFallbackTheme();
      }
    } else {
      console.warn("Ambient Light Sensor not supported, falling back.");
      applyFallbackTheme();
    }

    return () => {
      if (sensor) {
        sensor.stop();
      }
    };
  }, [fallback]);

  return (
    <div
      className={isDarkMode ? "dark" : "light"}
    >
      {children}
    </div>
  );
};

export default AmbientLightThemeProvider;