import sharp from 'sharp';
import fs from 'fs';

async function trimLogo() {
    try {
        console.log('Trimming logo...');
        await sharp('src/assets/logo1.png')
            .trim({ threshold: 10 }) 
            .toFile('src/assets/logo1_trimmed.png');
        
        console.log('Logo trimmed successfully!');
        
        // Backup the original and replace
        fs.renameSync('src/assets/logo1.png', 'src/assets/logo1_backup.png');
        fs.renameSync('src/assets/logo1_trimmed.png', 'src/assets/logo1.png');
        console.log('Replaced original file!');
    } catch (e) {
        console.error('Error trimming logo:', e);
    }
}
trimLogo();
