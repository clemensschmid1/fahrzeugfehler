/**
 * Brand logo URL mappings
 * Uses multiple reliable CDN sources for car brand logos
 * Fallback chain: carlogos.org > 1000logos.net > logos-world.net
 */

// Helper to generate logo URLs from multiple sources
function getLogosWorldUrl(brand: string): string {
  return `https://logos-world.net/wp-content/uploads/2020/${brand.includes('BMW') || brand.includes('Audi') || brand.includes('Ford') ? '04' : '05'}/${brand.replace(/\s+/g, '-')}-Logo.png`;
}

function getCarlogosUrl(brand: string): string {
  const normalized = brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `https://www.carlogos.org/car-logos/${normalized}-logo.png`;
}

export const BRAND_LOGOS: Record<string, string> = {
  // German Brands
  'bmw': 'https://www.carlogos.org/car-logos/bmw-logo.png',
  'mercedes-benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'mercedes': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'audi': 'https://www.carlogos.org/car-logos/audi-logo.png',
  'volkswagen': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  'vw': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  'porsche': 'https://www.carlogos.org/car-logos/porsche-logo.png',
  'opel': 'https://www.carlogos.org/car-logos/opel-logo.png',
  
  // American Brands
  'ford': 'https://www.carlogos.org/car-logos/ford-logo.png',
  'chevrolet': 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  'chevy': 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  'cadillac': 'https://www.carlogos.org/car-logos/cadillac-logo.png',
  'dodge': 'https://www.carlogos.org/car-logos/dodge-logo.png',
  'jeep': 'https://www.carlogos.org/car-logos/jeep-logo.png',
  'chrysler': 'https://www.carlogos.org/car-logos/chrysler-logo.png',
  'tesla': 'https://www.carlogos.org/car-logos/tesla-logo.png',
  
  // Japanese Brands
  'toyota': 'https://www.carlogos.org/car-logos/toyota-logo.png',
  'honda': 'https://www.carlogos.org/car-logos/honda-logo.png',
  'nissan': 'https://www.carlogos.org/car-logos/nissan-logo.png',
  'mazda': 'https://www.carlogos.org/car-logos/mazda-logo.png',
  'subaru': 'https://www.carlogos.org/car-logos/subaru-logo.png',
  'mitsubishi': 'https://www.carlogos.org/car-logos/mitsubishi-logo.png',
  'suzuki': 'https://www.carlogos.org/car-logos/suzuki-logo.png',
  'lexus': 'https://www.carlogos.org/car-logos/lexus-logo.png',
  'infiniti': 'https://www.carlogos.org/car-logos/infiniti-logo.png',
  'acura': 'https://www.carlogos.org/car-logos/acura-logo.png',
  
  // Korean Brands
  'hyundai': 'https://www.carlogos.org/car-logos/hyundai-logo.png',
  'kia': 'https://www.carlogos.org/car-logos/kia-logo.png',
  
  // European Brands
  'volvo': 'https://www.carlogos.org/car-logos/volvo-logo.png',
  'peugeot': 'https://www.carlogos.org/car-logos/peugeot-logo.png',
  'renault': 'https://www.carlogos.org/car-logos/renault-logo.png',
  'citroen': 'https://www.carlogos.org/car-logos/citroen-logo.png',
  'citroën': 'https://www.carlogos.org/car-logos/citroen-logo.png',
  'fiat': 'https://www.carlogos.org/car-logos/fiat-logo.png',
  'alfa-romeo': 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png',
  'alfaromeo': 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png',
  'ferrari': 'https://www.carlogos.org/car-logos/ferrari-logo.png',
  'lamborghini': 'https://www.carlogos.org/car-logos/lamborghini-logo.png',
  'maserati': 'https://www.carlogos.org/car-logos/maserati-logo.png',
  'jaguar': 'https://www.carlogos.org/car-logos/jaguar-logo.png',
  'land-rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  'landrover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  'mini': 'https://www.carlogos.org/car-logos/mini-logo.png',
  'rolls-royce': 'https://www.carlogos.org/car-logos/rolls-royce-logo.png',
  'rollsroyce': 'https://www.carlogos.org/car-logos/rolls-royce-logo.png',
  'skoda': 'https://www.carlogos.org/car-logos/skoda-logo.png',
  'škoda': 'https://www.carlogos.org/car-logos/skoda-logo.png',
  'seat': 'https://www.carlogos.org/car-logos/seat-logo.png',
  
  // Additional American Brands
  'ram': 'https://www.carlogos.org/car-logos/ram-logo.png',
  'gmc': 'https://www.carlogos.org/car-logos/gmc-logo.png',
  'lincoln': 'https://www.carlogos.org/car-logos/lincoln-logo.png',
  'buick': 'https://www.carlogos.org/car-logos/buick-logo.png',
  
  // Luxury & Premium Brands
  'genesis': 'https://www.carlogos.org/car-logos/genesis-logo.png',
  'polestar': 'https://www.carlogos.org/car-logos/polestar-logo.png',
  'bentley': 'https://www.carlogos.org/car-logos/bentley-logo.png',
  'aston-martin': 'https://www.carlogos.org/car-logos/aston-martin-logo.png',
  'mclaren': 'https://www.carlogos.org/car-logos/mclaren-logo.png',
  
  // Additional European Brands
  'smart': 'https://www.carlogos.org/car-logos/smart-logo.png',
  'ds': 'https://www.carlogos.org/car-logos/ds-automobiles-logo.png',
  'ds-automobiles': 'https://www.carlogos.org/car-logos/ds-automobiles-logo.png',
};

/**
 * Get logo URL for a brand by slug or name
 * Falls back to database logo_url if available, otherwise uses mapping
 */
export function getBrandLogoUrl(brandSlug: string, brandName?: string, dbLogoUrl?: string | null): string | null {
  // First check database logo_url
  if (dbLogoUrl) {
    return dbLogoUrl;
  }
  
  // Then check mapping by slug
  const slugLower = brandSlug.toLowerCase().trim();
  if (BRAND_LOGOS[slugLower]) {
    return BRAND_LOGOS[slugLower];
  }
  
  // Try by name if provided
  if (brandName) {
    const nameLower = brandName.toLowerCase().trim();
    // Try exact match
    if (BRAND_LOGOS[nameLower]) {
      return BRAND_LOGOS[nameLower];
    }
    // Try with spaces replaced by hyphens
    const nameHyphenated = nameLower.replace(/\s+/g, '-');
    if (BRAND_LOGOS[nameHyphenated]) {
      return BRAND_LOGOS[nameHyphenated];
    }
    // Try with hyphens replaced by spaces
    const nameSpaced = nameLower.replace(/-/g, ' ');
    if (BRAND_LOGOS[nameSpaced]) {
      return BRAND_LOGOS[nameSpaced];
    }
  }
  
  // Final fallback: try to generate URL from carlogos.org
  const normalizedSlug = brandSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (normalizedSlug) {
    return getCarlogosUrl(normalizedSlug);
  }
  
  return null;
}

