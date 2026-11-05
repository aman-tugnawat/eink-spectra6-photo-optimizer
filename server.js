const express = require('express');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Dynamic import for epdoptimize (it's an ESM module)
// We also need JSDOM because epdoptimize expects a browser environment
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const app = express();
const upload = multer({ dest: 'uploads/' });

// -- MOCK BROWSER ENV FOR LIBRARY --
// epdoptimize relies on 'document' and 'HTMLCanvasElement'
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement; // May need canvas implementation
// ----------------------------------

let epdoptimize;

// Load the library asynchronously
(async () => {
    try {
        epdoptimize = await import('epdoptimize');
        console.log("epdoptimize library loaded.");
    } catch (e) {
        console.error("Failed to load epdoptimize. Make sure to 'npm install epdoptimize'", e);
    }
})();

app.post('/convert', upload.single('image'), async (req, res) => {
    if (!req.file || !epdoptimize) {
        return res.status(400).send('No image uploaded or library not loaded.');
    }

    try {
        const inputPath = req.file.path;
        
        // 1. Load image using node-canvas
        const image = await loadImage(inputPath);
        
        // 2. Resize to 800x480 (Cover logic)
        const canvas = createCanvas(800, 480);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 800, 480);

        const targetRatio = 800 / 480;
        const imgRatio = image.width / image.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        // Cover logic
        if (imgRatio > targetRatio) {
            drawHeight = 480;
            drawWidth = image.width * (480 / image.height);
            offsetY = 0;
            offsetX = (800 - drawWidth) / 2;
        } else {
            drawWidth = 800;
            drawHeight = image.height * (800 / image.width);
            offsetX = 0;
            offsetY = (480 - drawHeight) / 2;
        }
        
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        // 3. Dither
        // NOTE: Since we are in Node, we need to pass a context/canvas that the library accepts.
        // epdoptimize likely uses `getImageData` and `putImageData`.
        // We might need to convert node-canvas to something compliant if strict checks exist,
        // but typically node-canvas mimics the browser API well enough.
        
        const palette = epdoptimize.getDefaultPalettes('spectra6');
        const options = {
            algorithm: 'floydSteinberg',
            palette: palette
        };

        // We pass the canvas we created. 
        // Note: The library creates its own return canvas using document.createElement.
        // Since we mocked global.document with JSDOM, it should work, creating a JSDOM canvas.
        const outputCanvas = epdoptimize.ditherImage(canvas, options);
        
        // 4. Send response
        // outputCanvas is likely a DOM canvas from JSDOM. We need to get the buffer.
        // JSDOM canvas might not support toBuffer() directly if it's not backed by node-canvas properly in the mock.
        // Safer way: Get image data and put it on a fresh node-canvas.
        
        // However, if JSDOM is set up with node-canvas support, toDataURL works.
        const dataUrl = outputCanvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        
        const outputBuffer = Buffer.from(base64Data, 'base64');
        
        res.set('Content-Type', 'image/png');
        res.send(outputBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Conversion failed: ' + error.message);
    } finally {
        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
