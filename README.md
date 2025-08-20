# react-ambient-light-adaptive-theme

A React component that automatically switches between dark and light themes based on the ambient light levels detected by the **AmbientLightSensor** API. This package aims to enhance the user experience by adapting the app's theme to the surrounding lighting conditions.

## Features
- **Automatic Theme Switching**: Changes the theme based on the ambient light levels.
  - **Dark mode** when the light level is low.
  - **Light mode** when the light level is high.
- **Fallback Options**:
  - **System Preference-Based Theming** when AmbientLightSensor is not available.
  - **Time-Based Theming** (dark mode during night hours).
- **Simple Integration**: Just wrap your application with the `AmbientLightThemeProvider` component.

## Installation

To install the package, run the following command:

```bash
npm install react-ambient-light-adaptive-theme
