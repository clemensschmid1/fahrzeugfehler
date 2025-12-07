import { createCanvas, loadImage } from 'canvas';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface ImageFormat {
  width: number;
  height: number;
  name: string;
}

export const IMAGE_FORMATS: Record<string, ImageFormat> = {
  vertical: { width: 1080, height: 1920, name: 'Vertical (1080×1920)' },
  horizontal: { width: 1920, height: 1080, name: 'Horizontal (1920×1080)' },
  square: { width: 1080, height: 1080, name: 'Square (1080×1080)' },
  instagram_story: { width: 1080, height: 1920, name: 'Instagram Story (1080×1920)' },
  instagram_post: { width: 1080, height: 1080, name: 'Instagram Post (1080×1080)' },
  pinterest: { width: 1000, height: 1500, name: 'Pinterest (1000×1500)' },
  twitter: { width: 1200, height: 675, name: 'Twitter (1200×675)' },
};

interface ImageMetadata {
  manufacturer?: string;
  partType?: string;
  partSeries?: string;
  sector?: string;
  tags?: string[];
  date?: string;
}

interface GenerateImageParams {
  title: string;
  body: string;
  slug: string;
  format?: ImageFormat;
  metadata?: ImageMetadata;
}

/**
 * Wraps text with perfect line breaks
 */
function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Creates Infoneva purple gradient
 */
function createInfonevaGradient(ctx: any, x: number, y: number, width: number): any {
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, '#6B46C1');
  gradient.addColorStop(0.25, '#8B5CF6');
  gradient.addColorStop(0.5, '#A855F7');
  gradient.addColorStop(0.75, '#8B5CF6');
  gradient.addColorStop(1, '#6B46C1');
  return gradient;
}

/**
 * Creates cyan accent gradient
 */
function createAccentGradient(ctx: any, x: number, y: number, width: number, height: number): any {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, '#00E0FF');
  gradient.addColorStop(0.5, '#00B8D4');
  gradient.addColorStop(1, '#0088A3');
  return gradient;
}

/**
 * Draws Infoneva logo with perfect typography
 */
function drawInfonevaLogo(ctx: any, x: number, y: number, fontSize: number): { width: number; height: number } {
  const logoText = 'Infoneva';
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
  ctx.textBaseline = 'top';
  
  const metrics = ctx.measureText(logoText);
  const width = metrics.width;
  const height = fontSize * 1.05;
  
  const gradient = createInfonevaGradient(ctx, x, y, width);
  ctx.fillStyle = gradient;
  ctx.fillText(logoText, x, y);
  
  return { width, height };
}

/**
 * Draws Apple-quality badge
 */
function drawBadge(ctx: any, x: number, y: number, text: string, color: string, bgColor: string): { width: number; height: number } {
  const paddingH = 12;
  const paddingV = 8;
  const borderRadius = 8;
  const fontSize = 15;
  
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const width = metrics.width + (paddingH * 2);
  const height = fontSize + (paddingV * 2);
  
  // Perfect rounded rectangle
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(x + borderRadius, y);
  ctx.lineTo(x + width - borderRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
  ctx.lineTo(x + width, y + height - borderRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
  ctx.lineTo(x + borderRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
  ctx.lineTo(x, y + borderRadius);
  ctx.quadraticCurveTo(x, y, x + borderRadius, y);
  ctx.closePath();
  ctx.fill();
  
  // Subtle border
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.15;
  ctx.stroke();
  ctx.globalAlpha = 1.0;
  
  // Text
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + paddingH, y + height / 2);
  ctx.textBaseline = 'top';
  
  return { width, height };
}

/**
 * Generates Apple-quality professional image
 */
export async function generateImage({ title, body, slug, format, metadata }: GenerateImageParams): Promise<string> {
  const imageFormat = format || IMAGE_FORMATS.vertical;
  const width = imageFormat.width;
  const height = imageFormat.height;
  
  // Apple-style generous but precise margins
  const margin = Math.min(60, width * 0.056);
  const contentWidth = width - (margin * 2);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Apple-quality gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#0E0E14');
  bgGradient.addColorStop(0.2, '#0F0F16');
  bgGradient.addColorStop(0.5, '#0D0D13');
  bgGradient.addColorStop(0.8, '#0C0C12');
  bgGradient.addColorStop(1, '#0A0A10');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial accent
  const radialGradient = ctx.createRadialGradient(width * 0.8, height * 0.2, 0, width * 0.8, height * 0.2, width * 2);
  radialGradient.addColorStop(0, 'rgba(0, 224, 255, 0.03)');
  radialGradient.addColorStop(0.4, 'rgba(168, 85, 247, 0.015)');
  radialGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, width, height);

  // Header section - Apple spacing
  const headerTop = margin;
  const logoFontSize = Math.max(32, Math.min(42, width * 0.039));
  const logoResult = drawInfonevaLogo(ctx, margin, headerTop, logoFontSize);
  const headerBottom = headerTop + logoResult.height + 20;

  // Badges - Apple-quality spacing
  let badgesY = headerBottom;
  const badgeSpacing = 8;
  let currentX = margin;
  let badgesHeight = 0;
  
  if (metadata) {
    const badges: Array<{ text: string; color: string; bgColor: string }> = [];
    
    if (metadata.manufacturer) {
      badges.push({ text: metadata.manufacturer, color: '#00E0FF', bgColor: 'rgba(0, 224, 255, 0.16)' });
    }
    if (metadata.sector) {
      badges.push({ text: metadata.sector, color: '#00B8D4', bgColor: 'rgba(0, 184, 212, 0.16)' });
    }
    if (metadata.partType) {
      badges.push({ text: metadata.partType, color: '#A855F7', bgColor: 'rgba(168, 85, 247, 0.16)' });
    }
    if (metadata.partSeries) {
      badges.push({ text: metadata.partSeries, color: '#7C3AED', bgColor: 'rgba(124, 58, 237, 0.16)' });
    }
    if (metadata.tags && metadata.tags.length > 0) {
      badges.push({ text: metadata.tags[0], color: '#B8B8B8', bgColor: 'rgba(184, 184, 184, 0.12)' });
    }
    
    if (badges.length > 0) {
      badges.forEach((badge) => {
        const badgeResult = drawBadge(ctx, currentX, badgesY, badge.text, badge.color, badge.bgColor);
        currentX += badgeResult.width + badgeSpacing;
        badgesHeight = Math.max(badgesHeight, badgeResult.height);
      });
      
      badgesY += badgesHeight + 28;
    }
  }

  // Title - Apple typography scale
  const titleY = badgesY;
  const titleFontSize = Math.max(64, Math.min(104, width * 0.096));
  const titleMaxChars = Math.floor(width / 8);
  let titleText = title.length > titleMaxChars 
    ? title.substring(0, titleMaxChars - 3) + '...' 
    : title;

  ctx.font = `800 ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
  ctx.textBaseline = 'top';
  
  const titleLines = wrapText(ctx, titleText, contentWidth);
  const titleLineHeight = titleFontSize * 1.18;
  
  titleLines.forEach((line, index) => {
    const gradient = createAccentGradient(
      ctx,
      margin,
      titleY + (index * titleLineHeight),
      ctx.measureText(line).width,
      titleLineHeight
    );
    ctx.fillStyle = gradient;
    ctx.fillText(line, margin, titleY + (index * titleLineHeight), contentWidth);
  });

  const titleHeight = titleLines.length * titleLineHeight;
  const dividerY = titleY + titleHeight + 32;

  // Divider - Apple subtlety
  ctx.strokeStyle = '#00E0FF';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(margin, dividerY);
  ctx.lineTo(width - margin, dividerY);
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // Body text - Apple readability
  const bodyStartY = dividerY + 32;
  const bodyFontSize = Math.max(38, Math.min(56, width * 0.052));
  const bodyMaxChars = Math.floor((width * height) / 2400);
  let bodyText = body.length > bodyMaxChars 
    ? body.substring(0, bodyMaxChars - 3) + '...' 
    : body;

  ctx.font = `400 ${bodyFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillStyle = '#F5F5F7';
  ctx.textBaseline = 'top';
  
  const bodyLines = wrapText(ctx, bodyText, contentWidth);
  const bodyLineHeight = bodyFontSize * 1.5;
  const footerHeight = 70;
  const maxBodyLines = Math.floor((height - bodyStartY - footerHeight) / bodyLineHeight);
  const displayBodyLines = bodyLines.slice(0, maxBodyLines);
  
  // Apple-style subtle background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  ctx.fillRect(margin - 8, bodyStartY - 8, contentWidth + 16, displayBodyLines.length * bodyLineHeight + 16);
  
  displayBodyLines.forEach((line, index) => {
    ctx.fillStyle = '#F5F5F7';
    ctx.fillText(line, margin, bodyStartY + (index * bodyLineHeight), contentWidth);
  });

  // Footer - Apple minimalism
  const footerY = height - footerHeight;
  const footerFontSize = Math.max(26, Math.min(34, width * 0.031));
  
  // Footer background
  const footerGradient = ctx.createLinearGradient(0, footerY - 8, 0, height);
  footerGradient.addColorStop(0, 'rgba(0, 224, 255, 0.08)');
  footerGradient.addColorStop(1, 'rgba(0, 224, 255, 0.16)');
  ctx.fillStyle = footerGradient;
  ctx.fillRect(0, footerY - 8, width, footerHeight + 8);
  
  // Date
  if (metadata?.date) {
    const dateFontSize = Math.max(17, Math.min(21, width * 0.019));
    ctx.font = `${dateFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = 'rgba(180, 180, 180, 0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(metadata.date, margin, footerY + 6);
  }
  
  // Domain with gradient
  ctx.font = `600 ${footerFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;
  ctx.textAlign = 'center';
  const footerTextGradient = createInfonevaGradient(ctx, 0, footerY, width);
  ctx.fillStyle = footerTextGradient;
  ctx.fillText('infoneva.com', width / 2, footerY + 5);
  
  ctx.textAlign = 'left';

  // Save image
  const buffer = canvas.toBuffer('image/png');
  const outputDir = join(process.cwd(), 'public', 'generated');
  
  try {
    await mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const formatSuffix = format && format !== IMAGE_FORMATS.vertical 
    ? `_${format.width}x${format.height}` 
    : '';
  // Add version timestamp to force regeneration
  const version = Date.now();
  const outputPath = join(outputDir, `${slug}${formatSuffix}.png`);
  await writeFile(outputPath, buffer);

  return `/generated/${slug}${formatSuffix}.png?v=${version}`;
}
