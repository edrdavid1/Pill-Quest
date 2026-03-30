const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Размеры иконок для PWA
const SIZES = [
    72, 96, 128, 144, 152, 192, 384, 512
];

async function generateIcons() {
    const logoPath = path.join(__dirname, 'logo.png');
    
    if (!fs.existsSync(logoPath)) {
        console.error('logo.png не найден!');
        return;
    }

    const img = await loadImage(logoPath);
    console.log(`Исходное изображение: ${img.width}x${img.height}`);

    for (const size of SIZES) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Рисуем изображение с масштабированием
        ctx.drawImage(img, 0, 0, size, size);
        
        // Сохраняем иконку
        const outputPath = path.join(__dirname, `icon-${size}x${size}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✓ Создана иконка: icon-${size}x${size}.png`);
    }

    // Создаём SVG для масштабируемой версии
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="logo.png" width="512" height="512"/>
</svg>`;
    
    fs.writeFileSync(path.join(__dirname, 'icon.svg'), svgContent);
    console.log('✓ Создана SVG иконка: icon.svg');
    
    console.log('\nГотово! Все иконки созданы в папке icons/');
}

generateIcons().catch(console.error);
