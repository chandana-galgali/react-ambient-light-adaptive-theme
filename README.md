# react-ambient-light-adaptive-theme

A React component that automatically switches between dark and light themes based on a device's ambient light levels, with built-in fallbacks. This package aims to enhance the user experience by adapting the app's theme to the surrounding lighting conditions.

## Features
- **Automatic Theme Switching**: Changes the theme based on the ambient light levels detected by the **AmbientLightSensor** API.
  - **Dark mode** is enabled when the light level is low.
  - **Light mode** is enabled when the light level is high.
- **Fallback Options**:
  - **System Preference-Based Theming**: If the AmbientLightSensor is not available, the component will fall back to using the user's system preference for light or dark mode.
  - **Time-Based Theming**: As an alternative, you can configure it to switch themes based on the time of day (e.g., dark mode from 7 PM to 7 AM).
- **Simple Integration**: Just wrap your application with the `AmbientLightThemeProvider` component.

## Disclaimer on Browser Support
This package relies on the browser's implementation of the experimental `AmbientLightSensor` API. While a physical light sensor may be present on a device (to enable features like auto-brightness), not all browsers expose this data to web applications. In such cases, the component will use the configured fallback logic to ensure a consistent user experience.

## Installation
To install the package, run the following command:
```bash
npm install react-ambient-light-adaptive-theme
```

## Usage
Once installed, wrap your application inside the AmbientLightThemeProvider component to enable automatic theme switching.
```JavaScript

import React from 'react';
import AmbientLightThemeProvider from 'react-ambient-light-adaptive-theme';

const App = () => {
  return (
    <AmbientLightThemeProvider>
      <div>
        <h1>Welcome to the Ambient Light Adaptive Theme App</h1>
        <p>The theme will adjust automatically based on the ambient light.</p>
      </div>
    </AmbientLightThemeProvider>
  );
};

export default App;
```

## Configuration Options
- **Fallback Behavior**: You can configure the fallback to use either "system" or "time-based" logic.
```JavaScript
<AmbientLightThemeProvider fallback="system" /> // Options: "system" or "time-based"
```

## Important
Your application's main CSS file should contain CSS variables for background and foreground colors, and an additional class for dark mode to enable the theme switching.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
Feel free to open issues or submit pull requests if you would like to contribute to the development of this project. Contributions are welcome!
