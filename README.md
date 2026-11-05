# Spectra 6 Image Optimizer

This project contains two parts:

1.  **Web App (`index.html`):** A standalone tool you can run directly in your browser.
2.  **API (`server.js`):** A Node.js server for automated processing.

## 1\. Using the Web App

Simply open `index.html` in any modern web browser. No installation required.

  - **Upload:** Supports PNG, JPG, HEIC.
  - **Resize:** Automatically covers 800x480.
  - **Dither:** Uses `epdoptimize` with Floyd-Steinberg dithering for the Spectra 6 palette.

## 2\. Using the API

If you want to run the automated API server:

### Prerequisites

  - Node.js installed.
  - System dependencies for `node-canvas` (e.g., `libcairo2-dev` on Ubuntu/Debian, or automagically handled on macOS/Windows usually).

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
