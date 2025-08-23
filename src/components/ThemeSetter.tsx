"use client";
import { useEffect } from 'react';
import { useTheme } from './AmbientLightThemeProvider';

const ThemeSetter = () => {
    const { isDarkMode } = useTheme();

    useEffect(() => {
        if (document.body) {
            if (isDarkMode) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
    }, [isDarkMode]);

    return null;
};

export default ThemeSetter;