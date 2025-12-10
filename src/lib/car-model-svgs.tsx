/**
 * Minimalistic, modern SVG car model illustrations
 * Black on white background, clean geometric design
 */

import React from 'react';

export interface CarModelSVGProps {
  className?: string;
}

/**
 * Mercedes-Benz C-Class - Minimalistic illustration
 */
export function MercedesCClassSVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* Car body - sleek sedan silhouette */}
      <path d="M 50 120 Q 60 100, 80 90 L 120 85 Q 140 80, 160 82 L 240 82 Q 260 80, 280 85 L 320 90 Q 340 100, 350 120 L 355 160 Q 350 175, 340 180 L 60 180 Q 50 175, 50 160 Z" 
            fill="black" stroke="none"/>
      {/* Windows */}
      <path d="M 90 95 L 130 92 Q 150 90, 170 92 L 170 130 Q 150 135, 130 132 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 230 92 L 270 92 Q 290 90, 310 95 L 310 132 Q 290 135, 270 132 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels */}
      <circle cx="120" cy="160" r="18" fill="black"/>
      <circle cx="120" cy="160" r="12" fill="white"/>
      <circle cx="280" cy="160" r="18" fill="black"/>
      <circle cx="280" cy="160" r="12" fill="white"/>
      {/* Grille - Mercedes star area */}
      <path d="M 180 95 L 220 95" stroke="black" strokeWidth="3"/>
      <circle cx="200" cy="95" r="8" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * Mercedes-Benz E-Class - Minimalistic illustration
 */
export function MercedesEClassSVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* Car body - elegant sedan */}
      <path d="M 45 125 Q 55 100, 75 88 L 115 83 Q 135 78, 155 80 L 245 80 Q 265 78, 285 83 L 325 88 Q 345 100, 355 125 L 360 165 Q 355 180, 345 185 L 55 185 Q 45 180, 45 165 Z" 
            fill="black" stroke="none"/>
      {/* Windows */}
      <path d="M 85 95 L 125 90 Q 145 88, 165 90 L 165 135 Q 145 140, 125 137 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 235 90 L 275 90 Q 295 88, 315 95 L 315 137 Q 295 140, 275 137 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels */}
      <circle cx="125" cy="165" r="20" fill="black"/>
      <circle cx="125" cy="165" r="13" fill="white"/>
      <circle cx="275" cy="165" r="20" fill="black"/>
      <circle cx="275" cy="165" r="13" fill="white"/>
      {/* Grille */}
      <path d="M 175 90 L 225 90" stroke="black" strokeWidth="3"/>
      <circle cx="200" cy="90" r="10" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * Mercedes-Benz S-Class - Minimalistic illustration
 */
export function MercedesSClassSVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* Car body - luxury sedan */}
      <path d="M 40 130 Q 50 105, 70 92 L 110 87 Q 130 82, 150 84 L 250 84 Q 270 82, 290 87 L 330 92 Q 350 105, 360 130 L 365 170 Q 360 185, 350 190 L 50 190 Q 40 185, 40 170 Z" 
            fill="black" stroke="none"/>
      {/* Windows - longer for luxury feel */}
      <path d="M 80 98 L 120 93 Q 140 91, 160 93 L 160 145 Q 140 150, 120 147 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 240 93 L 280 93 Q 300 91, 320 98 L 320 147 Q 300 150, 280 147 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels - larger */}
      <circle cx="130" cy="170" r="22" fill="black"/>
      <circle cx="130" cy="170" r="14" fill="white"/>
      <circle cx="270" cy="170" r="22" fill="black"/>
      <circle cx="270" cy="170" r="14" fill="white"/>
      {/* Grille */}
      <path d="M 170 88 L 230 88" stroke="black" strokeWidth="3"/>
      <circle cx="200" cy="88" r="12" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * Mercedes-Benz GLE - Minimalistic illustration (SUV)
 */
export function MercedesGLESVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* SUV body - taller, boxier */}
      <path d="M 50 110 Q 60 95, 80 88 L 120 85 Q 140 82, 160 84 L 240 84 Q 260 82, 280 85 L 320 88 Q 340 95, 350 110 L 355 150 Q 350 170, 340 175 L 60 175 Q 50 170, 50 150 Z" 
            fill="black" stroke="none"/>
      {/* Windows - taller for SUV */}
      <path d="M 90 92 L 130 89 Q 150 87, 170 89 L 170 130 Q 150 135, 130 132 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 230 89 L 270 89 Q 290 87, 310 92 L 310 132 Q 290 135, 270 132 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels - larger for SUV */}
      <circle cx="120" cy="150" r="22" fill="black"/>
      <circle cx="120" cy="150" r="14" fill="white"/>
      <circle cx="280" cy="150" r="22" fill="black"/>
      <circle cx="280" cy="150" r="14" fill="white"/>
      {/* Grille */}
      <path d="M 180 87 L 220 87" stroke="black" strokeWidth="3"/>
      <circle cx="200" cy="87" r="10" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * BMW 3 Series - Minimalistic illustration
 */
export function BMW3SeriesSVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* Car body - sporty sedan */}
      <path d="M 50 118 Q 60 98, 80 88 L 120 84 Q 140 80, 160 82 L 240 82 Q 260 80, 280 84 L 320 88 Q 340 98, 350 118 L 355 158 Q 350 173, 340 178 L 60 178 Q 50 173, 50 158 Z" 
            fill="black" stroke="none"/>
      {/* Windows - sporty angle */}
      <path d="M 88 94 L 128 90 Q 148 88, 168 90 L 168 128 Q 148 133, 128 130 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 232 90 L 272 90 Q 292 88, 312 94 L 312 130 Q 292 133, 272 130 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels */}
      <circle cx="120" cy="158" r="18" fill="black"/>
      <circle cx="120" cy="158" r="12" fill="white"/>
      <circle cx="280" cy="158" r="18" fill="black"/>
      <circle cx="280" cy="158" r="12" fill="white"/>
      {/* BMW kidney grille */}
      <path d="M 185 88 Q 195 86, 200 88 Q 205 86, 215 88" stroke="black" strokeWidth="2.5" fill="none"/>
      <ellipse cx="192" cy="88" rx="6" ry="4" fill="none" stroke="black" strokeWidth="2"/>
      <ellipse cx="208" cy="88" rx="6" ry="4" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * BMW 5 Series - Minimalistic illustration
 */
export function BMW5SeriesSVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* Car body - executive sedan */}
      <path d="M 45 122 Q 55 102, 75 90 L 115 85 Q 135 80, 155 82 L 245 82 Q 265 80, 285 85 L 325 90 Q 345 102, 355 122 L 360 162 Q 355 177, 345 182 L 55 182 Q 45 177, 45 162 Z" 
            fill="black" stroke="none"/>
      {/* Windows */}
      <path d="M 85 96 L 125 91 Q 145 89, 165 91 L 165 133 Q 145 138, 125 135 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 235 91 L 275 91 Q 295 89, 315 96 L 315 135 Q 295 138, 275 135 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels */}
      <circle cx="125" cy="162" r="20" fill="black"/>
      <circle cx="125" cy="162" r="13" fill="white"/>
      <circle cx="275" cy="162" r="20" fill="black"/>
      <circle cx="275" cy="162" r="13" fill="white"/>
      {/* BMW kidney grille */}
      <path d="M 180 89 Q 190 87, 200 89 Q 210 87, 220 89" stroke="black" strokeWidth="2.5" fill="none"/>
      <ellipse cx="192" cy="89" rx="7" ry="5" fill="none" stroke="black" strokeWidth="2"/>
      <ellipse cx="208" cy="89" rx="7" ry="5" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * BMW 7 Series - Minimalistic illustration
 */
export function BMW7SeriesSVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* Car body - luxury sedan */}
      <path d="M 40 128 Q 50 108, 70 94 L 110 89 Q 130 84, 150 86 L 250 86 Q 270 84, 290 89 L 330 94 Q 350 108, 360 128 L 365 168 Q 360 183, 350 188 L 50 188 Q 40 183, 40 168 Z" 
            fill="black" stroke="none"/>
      {/* Windows - longer */}
      <path d="M 80 100 L 120 95 Q 140 93, 160 95 L 160 143 Q 140 148, 120 145 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 240 95 L 280 95 Q 300 93, 320 100 L 320 145 Q 300 148, 280 145 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels - larger */}
      <circle cx="130" cy="168" r="22" fill="black"/>
      <circle cx="130" cy="168" r="14" fill="white"/>
      <circle cx="270" cy="168" r="22" fill="black"/>
      <circle cx="270" cy="168" r="14" fill="white"/>
      {/* BMW kidney grille - larger */}
      <path d="M 175 91 Q 185 89, 200 91 Q 215 89, 225 91" stroke="black" strokeWidth="3" fill="none"/>
      <ellipse cx="190" cy="91" rx="8" ry="6" fill="none" stroke="black" strokeWidth="2"/>
      <ellipse cx="210" cy="91" rx="8" ry="6" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * BMW X5 - Minimalistic illustration (SUV)
 */
export function BMWX5SVG({ className = '' }: CarModelSVGProps) {
  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="white"/>
      {/* SUV body */}
      <path d="M 50 108 Q 60 93, 80 86 L 120 83 Q 140 80, 160 82 L 240 82 Q 260 80, 280 83 L 320 86 Q 340 93, 350 108 L 355 148 Q 350 168, 340 173 L 60 173 Q 50 168, 50 148 Z" 
            fill="black" stroke="none"/>
      {/* Windows - taller */}
      <path d="M 90 90 L 130 87 Q 150 85, 170 87 L 170 128 Q 150 133, 130 130 Z" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 230 87 L 270 87 Q 290 85, 310 90 L 310 130 Q 290 133, 270 130 Z" fill="none" stroke="black" strokeWidth="2"/>
      {/* Wheels - larger */}
      <circle cx="120" cy="148" r="22" fill="black"/>
      <circle cx="120" cy="148" r="14" fill="white"/>
      <circle cx="280" cy="148" r="22" fill="black"/>
      <circle cx="280" cy="148" r="14" fill="white"/>
      {/* BMW kidney grille */}
      <path d="M 185 85 Q 195 83, 200 85 Q 205 83, 215 85" stroke="black" strokeWidth="2.5" fill="none"/>
      <ellipse cx="192" cy="85" rx="7" ry="5" fill="none" stroke="black" strokeWidth="2"/>
      <ellipse cx="208" cy="85" rx="7" ry="5" fill="none" stroke="black" strokeWidth="2"/>
    </svg>
  );
}

/**
 * Get SVG component for a car model
 */
export function getModelSVG(brandSlug: string, modelSlug: string): React.ComponentType<CarModelSVGProps> | null {
  const key = `${brandSlug.toLowerCase()}-${modelSlug.toLowerCase()}`;
  
  const svgMap: Record<string, React.ComponentType<CarModelSVGProps>> = {
    'mercedes-benz-c-class': MercedesCClassSVG,
    'mercedes-benz-e-class': MercedesEClassSVG,
    'mercedes-benz-s-class': MercedesSClassSVG,
    'mercedes-benz-gle': MercedesGLESVG,
    'bmw-3-series': BMW3SeriesSVG,
    'bmw-5-series': BMW5SeriesSVG,
    'bmw-7-series': BMW7SeriesSVG,
    'bmw-x5': BMWX5SVG,
  };

  // Try direct lookup
  if (svgMap[key]) {
    return svgMap[key];
  }

  // Try variations
  const brandVariations: Record<string, string> = {
    'mercedes': 'mercedes-benz',
    'mercedes-benz': 'mercedes-benz',
    'bmw': 'bmw',
  };

  const normalizedBrand = brandVariations[brandSlug.toLowerCase()] || brandSlug.toLowerCase();
  const altKey = `${normalizedBrand}-${modelSlug.toLowerCase()}`;
  
  return svgMap[altKey] || null;
}

/**
 * Convert SVG component to data URL for use as image src
 */
export function getModelSVGDataUrl(brandSlug: string, modelSlug: string): string | null {
  const SVGComponent = getModelSVG(brandSlug, modelSlug);
  if (!SVGComponent) return null;

  // For now, return a placeholder - in production, you'd render the SVG to a data URL
  // This is a simplified approach - you might want to use a library like react-svg-to-image
  // or pre-render these SVGs to static files
  return null;
}







