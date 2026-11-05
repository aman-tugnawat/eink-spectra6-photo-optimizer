# Spectra 6 Image Optimizer

This project contains two parts:

1.  **Web App (`index.html`):** A standalone tool you can run directly in your browser.
2.  **API (`server.js`):** A Node.js server for automated processing.

## 1\. Using the Web App

Live at https://aman-tugnawat.github.io/eink-spectra6-photo-optimizer/ . Fully self-contained: React, Babel and a precompiled Tailwind stylesheet live in `vendor/`, so it needs no CDN. Serve the folder (e.g. `python3 -m http.server`) or open `index.html`.

If you change Tailwind classes in `index.html`, rebuild the CSS with `npm run build:css`.

  - **Upload:** Supports PNG, JPG, HEIC.
  - **Resize:** Automatically covers 800x480.
  - **Dither:** Built-in Floyd-Steinberg dithering in the browser.

## 2\. Using the API

If you want to run the automated API server:

### Prerequisites

  - Node.js installed.
  - Node.js 18+. `canvas` v3 ships prebuilt binaries for common platforms.
  - The API uses `epdoptimize` 1.x (`spectra6Palette`, Floyd-Steinberg, then `replaceColors` to device colors).

### Installation

1.  Place `server.js` and `package.json` in a folder.
2.  Run:
    ```bash
    npm install
    ```

### Running the Server

```bash
node server.js
```

### Usage

Send a POST request to `http://localhost:3000/convert` with a form-data field named `image`.

```bash
curl -X POST -F "image=@myphoto.jpg" http://localhost:3000/convert --output spectra6_ready.png
```
