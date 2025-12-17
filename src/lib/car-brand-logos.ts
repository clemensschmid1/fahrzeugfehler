/**
 * Brand logo URL mappings
 * Uses Next.js API route as proxy to avoid CORS issues
 */

// Map brand slugs to API route paths
// The API route will proxy the request to carlogos.org
export const BRAND_LOGOS: Record<string, string> = {
  // German Brands
  'bmw': '/api/logos/bmw',
  'mercedes-benz': '/api/logos/mercedes-benz',
  'mercedes': '/api/logos/mercedes-benz',
  'audi': '/api/logos/audi',
  'volkswagen': '/api/logos/volkswagen',
  'vw': '/api/logos/volkswagen',
  'porsche': '/api/logos/porsche',
  'opel': '/api/logos/opel',
  'ford': '/api/logos/ford',
  'skoda': '/api/logos/skoda',
  'smart': '/api/logos/smart',
  
  // Japanese Brands
  'toyota': '/api/logos/toyota',
  'honda': '/api/logos/honda',
  'nissan': '/api/logos/nissan',
  'mazda': '/api/logos/mazda',
  'mitsubishi': '/api/logos/mitsubishi',
  'suzuki': '/api/logos/suzuki',
  'lexus': '/api/logos/lexus',
  'infiniti': '/api/logos/infiniti',
  
  // Korean Brands
  'hyundai': '/api/logos/hyundai',
  'kia': '/api/logos/kia',
  
  // European Brands
  'volvo': '/api/logos/volvo',
  'peugeot': '/api/logos/peugeot',
  'renault': '/api/logos/renault',
  'seat': '/api/logos/seat',
  'fiat': '/api/logos/fiat',
  'citroen': '/api/logos/citroen',
  'alfa-romeo': '/api/logos/alfa-romeo',
  'mini': '/api/logos/mini',
  'dacia': '/api/logos/dacia',
  'lada': '/api/logos/lada',
  
  // British Brands
  'land-rover': '/api/logos/land-rover',
  'jaguar': '/api/logos/jaguar',
  
  // American Brands
  'jeep': '/api/logos/jeep',
};

/**
 * Get logo URL for a brand by slug or name
 * Falls back to database logo_url if available, otherwise uses mapping
 * Uses Next.js API route as proxy to avoid CORS issues
 */
export function getBrandLogoUrl(brandSlug: string, brandName?: string, dbLogoUrl?: string | null): string | null {
  // First check database logo_url (if it's a full URL, not from carlogos.org)
  if (dbLogoUrl && !dbLogoUrl.includes('carlogos.org')) {
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
  
  // No logo found - return null to show fallback (initial letter)
  return null;
}

