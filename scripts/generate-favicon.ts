import { createCanvas } from 'canvas';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function generateFavicon() {
  const sizes = [16, 32, 180, 192, 512];
  const outputDir = join(process.cwd(), 'src', 'app');
  
  // Generate PNG favicons
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Black "F" text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.floor(size * 0.7)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', size / 2, size / 2);
    
    // Save PNG
    const buffer = canvas.toBuffer('image/png');
    let filename = '';
    if (size === 16) filename = 'favicon-16x16.png';
    else if (size === 32) filename = 'favicon-32x32.png';
    else if (size === 180) filename = 'apple-touch-icon.png';
    else if (size === 192) filename = 'android-chrome-192x192.png';
    else if (size === 512) filename = 'android-chrome-512x512.png';
    
    if (filename) {
      await writeFile(join(outputDir, filename), buffer);
      console.log(`✓ Generated ${filename}`);
    }
  }
  
  // Generate favicon.ico (32x32) - ICO format is complex, so we'll use PNG as fallback
  // Next.js will use favicon.ico if present, or fall back to icon.svg/icon.png
  const icoCanvas = createCanvas(32, 32);
  const icoCtx = icoCanvas.getContext('2d');
  
  icoCtx.fillStyle = '#FFFFFF';
  icoCtx.fillRect(0, 0, 32, 32);
  
  icoCtx.fillStyle = '#000000';
  icoCtx.font = 'bold 22px Arial, sans-serif';
  icoCtx.textAlign = 'center';
  icoCtx.textBaseline = 'middle';
  icoCtx.fillText('F', 16, 16);
  
  // Save as PNG (browsers accept PNG for .ico in modern setups)
  const icoBuffer = icoCanvas.toBuffer('image/png');
  await writeFile(join(outputDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated favicon.ico');
  
  console.log('\n✅ All favicon files generated successfully!');
}

generateFavicon().catch(console.error);










