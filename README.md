<p align="left">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=FFD62E" />
  <img alt="Build Status" src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img alt="Lint" src="https://img.shields.io/badge/lint-passing-brightgreen" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-passing-brightgreen" />
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue" />
</p>

# Accessibility Booster Extension

<img src="img/extension-screenshot.PNG" alt="Extension Screenshot" width="30%" height="30%"/>

**Version:** 1.0.0

## Student Details
- **Full Name:** Yusuf Huseyin Arpaci
- **Student ID:** s4012930

---

## Table of Contents
- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Solution Design](#solution-design)
- [Architecture Diagram](#architecture-diagram)
- [Screenshots](#screenshots)
- [Demo](#demo)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Linting](#linting)
- [Browser Compatibility](#browser-compatibility)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [License](#license)
- [Acknowledgements & Resources](#acknowledgements--resources)
- [Credits](#credits)
- [Contact](#contact)

---

## Description

The Accessibility Booster Chrome Extension enhances your browsing experience by adding a suite of accessibility features to any website. It aims to make the web more usable for everyone, including individuals with disabilities. The extension is lightweight and incredibly easy to use

---

## Features

This extension provides a variety of features to improve web accessibility, including:

* **High Contrast Mode:** Increases text visibility and reduces eye strain.
* **Dyslexia-Friendly Font:** Applies a font designed to be easier to read for users with dyslexia (e.g., OpenDyslexic).
* **Reading Line:** Adds a line to help focus while reading.
* **Colourblind Adjustments:** Offers filters for various types of colour blindness (Deuteranopia, Protanopia, Tritanopia).
* **Reduced Motion:** Minimizes animations and motion effects.
* **Keyboard Navigation Enhancements:** Improves focus indicators and tab navigation.
* **Large Click Targets:** Increases the size of interactive elements.
* **Custom Cursor:** Provides alternative cursor styles for better visibility along with greater size.
* **Auto Scroll:** Enables automatic page scrolling with zones at the top and bottom.
* **Hover Controls:** Provides controls that appear on hover for easier interaction.
* **Focus Mode:** Dims the surrounding page content to highlight the active reading area similar to the reading line.
* **Highlight Links:** Makes all links on a page highlighted.
* **Reading Progress Bar:** Shows a visual indicator at the top for how far you've scrolled through a page.
* **Image Descriptions (Alt Text Viewer):** Helps users see alternative text for images when hovering over them.

---

## Tech Stack

* TypeScript
* React (for the popup UI)
* Vite (for building and development server)
* Vitest (for testing)
* ESLint (for code linting)
* CSS (for styling accessibility features)
* Chrome Extensions API

---

## Solution Design

The extension is designed to be modular and scalable, with each accessibility feature implemented as a separate module. The popup UI is built with React for a modern, responsive experience. State is managed globally and persisted using Chrome's storage API, ensuring settings are applied across all tabs and sessions.

- **State Management:** All feature toggles and settings are stored in a global state object and persisted using Chrome's `storage.sync` API.
- **Performance:** Debounced storage writes and efficient tab messaging ensure minimal performance impact.
- **Accessibility First:** All UI components are designed with accessibility in mind, including ARIA labels and keyboard navigation.

---

## Architecture Diagram

<img src="img/architecture-diagram.png" alt="Architecture Diagram" width="100%" height="100%"/>

---

## Screenshots

- <img src="img/feature-example.PNG" alt="Feature Example Screenshot" width="100%" height="100%"/>  

---

## Demo

<img src="img/demo-animated.gif" alt="Animated demo of extension features" width="100%" height="100%"/>

---

## Prerequisites

**Note:** If doing **1A** for installation download both Git and Node.js. If doing **1B** only download Node.js

- [Git](https://git-scm.com/downloads/win) installed
  
  <img src="img/download-git.PNG" alt="Download Git Screenshot" width="80%" height="80%"/>
  
- [Node.js](https://nodejs.org/en/download) installed
  
  <img src="img/download-nodejs.PNG" alt="Download Node JS" width="80%" height="80%"/>

---

## Installation

**Note:** These instructions assume you are using Windows 10/11 and have installed Node.js as shown above. If you encounter issues, see the Troubleshooting section below.

1a. **Clone the Repository with Git**

Open Command Prompt, VSCode, or a terminal of your choice:

```bash
git clone https://github.com/s4012930/accessible-extension
cd accessible-extension
```
<img src="img/clone-repo.PNG" alt="Clone Repository Screenshot" width="100%" height="100%"/>

1b. **Download the Latest Release (No Git Required)**

1. Go to the [Releases page](https://github.com/s4012930/accessible-extension/releases) on GitHub.
2. Download the latest `.zip` release.
3. Extract the zip file to a folder (e.g., `accessible-extension-v1.0.X`).
4. Open Command Prompt and `cd` into that folder.

---

**Continue with the following steps for both methods:**

2. **Build the Extension:**
    ```bash
    npm install
    ```
    <img src="img/npm-install.PNG" alt="NPM Install Screenshot" width="100%" height="100%"/>

    ```bash
    npm run build
    ```
    <img src="img/npm-build.PNG" alt="NPM Build Screenshot" width="100%" height="100%"/>

3. **Load the Extension in Chrome:**

    Open Chrome and navigate to `chrome://extensions`.
      <img src="img/chrome-extensions-page.PNG" alt="Chrome Extensions Page" width="100%" height="100%"/>
    Enable "Developer mode" using the toggle switch in the top right corner.
      <img src="img/developer-mode-toggle.PNG" alt="Developer Mode Toggle" width="100%" height="100%"/>
    Click on the "Load unpacked" button.
      <img src="img/load-unpacked.PNG" alt="Load Unpacked Button" width="100%" height="100%"/>
    Select the [dist](http://_vscodecontentref_/0) folder.
      <img src="img/select-dist-folder.PNG" alt="Select Dist Folder" width="100%" height="100%"/>
    See enabled Accessibility Booster 1.0.0 inside of extensions.
      <img src="img/enabled-accessibility-booster.PNG" alt="Enabled Accessibility Booster Extension" width="100%" height="100%"/>

---

## Usage

1. Click on the Accessibility Booster icon in the Chrome toolbar to open the popup.
2. Toggle the desired accessibility features on or off using the switches and controls provided in the popup interface.
3. Settings are saved and applied automatically to all current and future tabs.
4. Use the keyboard shortcut `Ctrl+Shift+F` (or `Command+Shift+F` on Mac) to quickly open the extension popup without clicking.

---

## Available Scripts

In the project directory, you can run the following scripts:

* `npm run dev`: Starts the development server using Vite.
* `npm run build`: Builds the extension for production (compiles TypeScript, Vite build, and copies CSS).
* `npm run lint`: Lints the codebase using ESLint.
* `npm run preview`: Serves the production build locally for preview.
* `npm run test`: Runs tests once using Vitest.
* `npm run test:watch`: Runs tests in watch mode.
* `npm run test:ui`: Opens the Vitest UI for an interactive testing experience.
* `npm run test:html`: Runs tests and generates an HTML report (`test-results.html`), then attempts to open it.

---

## Testing

To run the automated tests for this extension:

* For a single run:
    ```bash
    npm run test
    ```
* To run tests and view results in an HTML report:
    ```bash
    npm run test:html
    ```
    This will generate `test-results.html` in the root directory.
* For an interactive UI:
    ```bash
    npm run test:ui
    ```

* My Recommendation:
    ```bash
    npm run test:ui
    ```

---

## Linting

To check code quality and style, run:

```bash
npm run lint
```
If all checks pass, you'll see:
```
 ESLint: All files passed linting checks!
```

---

## Browser Compatibility

- Chrome (latest)
- Edge (latest)
- Opera (latest)
- Brave (latest)

---

## Security & Privacy

This extension does **NOT** collect or transmit any personal data. All settings are stored locally using Chrome’s secure storage API.

---

## Troubleshooting

- **Extension not appearing?**  
  Make sure you selected the correct [dist](http://_vscodecontentref_/1) folder and that your manifest is valid.
- **Feature not working on a site?**  
  Some sites restrict content scripts. Try refreshing the page or checking permissions.
- **"git" or "npm" not recognized?**  
  Ensure you have [Git](https://git-scm.com/downloads/win) and [Node.js](https://nodejs.org/en/download) installed.  
  If you just installed them, close and reopen your terminal or Command Prompt before running commands again.
- **Permission errors or "EACCES"/"EPERM" errors during install?**  
  Try running your terminal or Command Prompt as an administrator:  
  - Right-click the Command Prompt or terminal icon and select **"Run as administrator"**.  
  - Then try running the commands again.

---

## FAQ

**Q: Does this extension work on all websites?**  
A: Most features work on the majority of websites, but some highly dynamic or protected sites may limit functionality.

**Q: How do I reset all settings to default?**  
A: Open the popup and click the "Turn All Off" button at the bottom.

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgements & Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [WebAIM: Web Accessibility In Mind](https://webaim.org/)
- [Chrome for Developers: Accessibility](https://developer.chrome.com/docs/accessibility)
- [Shields.io for Badges](https://shields.io/)

---

## Contact

For questions or support, please contact me: s4012930@student.rmit.edu.au

---

## Credits

- Icons by [Lucide](https://lucide.dev/)
- Fonts by [OpenDyslexic](https://opendyslexic.org/)
