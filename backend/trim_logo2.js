import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../frontend/src/assets/logo.png');
const outputPath = path.join(__dirname, '../frontend/src/assets/logo_trimmed.png');

async function trimLogo() {
    try {
        const buffer = await sharp(inputPath).toBuffer();
        await sharp(buffer)
            .trim()
            .toFile(outputPath);
        console.log("Logo trimmed successfully!");
    } catch (err) {
        console.error("Error trimming logo:", err);
    }
}

trimLogo();
