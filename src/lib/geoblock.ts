// Geoblocking utility for API routes

const BLOCKED_COUNTRIES = [
  'IN', // India
  'PK', // Pakistan
  'BD', // Bangladesh
  'NG', // Nigeria
  'KE', // Kenya
  'ET', // Ethiopia
  'GH', // Ghana
  'MA', // Morocco
  'DZ', // Algeria
  'TN', // Tunisia
  'PH', // Philippines
  'VN', // Vietnam
  'TH', // Thailand
  'MM', // Myanmar
  'LK', // Sri Lanka
  'NP', // Nepal
  'UA', // Ukraine
  'RU', // Russia
  'IR', // Iran
  'IQ', // Iraq
  'SY', // Syria
  'AF'  // Afghanistan
];

export function isCountryBlocked(countryCode: string | null): boolean {
  if (!countryCode) return false;
  return BLOCKED_COUNTRIES.includes(countryCode.toUpperCase());
}

export function getCountryFromRequest(req: Request): string | null {
  // Try Cloudflare's country header first
  const cfCountry = req.headers.get('cf-ipcountry');
  if (cfCountry) return cfCountry;
  
  // Fallback to other common headers
  const xForwardedCountry = req.headers.get('x-forwarded-country');
  if (xForwardedCountry) return xForwardedCountry;
  
  return null;
}

export function checkGeoblock(req: Request): { blocked: boolean; country?: string } {
  const country = getCountryFromRequest(req);
  const blocked = isCountryBlocked(country);
  
  return {
    blocked,
    country: country || 'unknown'
  };
} 