"use client";
import React, { useState, useEffect, ReactNode, createContext, useContext } from "react";

interface ThemeContextType {
    isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

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
                alert("Ambient Light Sensor is supported by your browser.");
                sensor = new window.AmbientLightSensor();
                sensor.onreading = (event) => {
                    const lightLevel = event.illuminance;
                    setIsDarkMode(lightLevel < 40);
                };
                sensor.onerror = (event) => {
                    applyFallbackTheme();
                };
                sensor.start();
            } catch (error) {
                applyFallbackTheme();
            }
        } else {
            alert("Ambient Light Sensor is not supported by your browser.");
            applyFallbackTheme();
        }

        return () => {
            if (sensor) {
                sensor.stop();
            }
        };
    }, [fallback]);

    return (
        <ThemeContext.Provider value={{ isDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a AmbientLightThemeProvider');
    }
    return context;
};

export default AmbientLightThemeProvider;