const express = require('express');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// epdoptimize is ESM; load it with dynamic import. It works directly on node-canvas, no DOM needed.
const app = express();
const upload = multer({ dest: 'uploads/' });

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

        // 3. Dither with calibrated Spectra 6 colors, then map to the colors the panel expects
        const palette = epdoptimize.spectra6Palette;
        const dithered = createCanvas(800, 480);
        await epdoptimize.ditherImage(canvas, dithered, {
            palette,
            ditheringType: 'errorDiffusion',
            errorDiffusionMatrix: 'floydSteinberg',
            serpentine: true,
        });
        const device = createCanvas(800, 480);
        epdoptimize.replaceColors(dithered, device, palette);

        // 4. Send response
        const outputBuffer = device.toBuffer('image/png');

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
