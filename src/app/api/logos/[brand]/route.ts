import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for car brand logos to avoid CORS issues
 * Usage: /api/logos/[brand]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  const { brand } = await params;
  
  // Map brand slugs to logo URLs
  const logoMap: Record<string, string> = {
    'bmw': 'https://www.carlogos.org/car-logos/bmw-logo.png',
    'mercedes-benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
    'mercedes': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
    'audi': 'https://www.carlogos.org/car-logos/audi-logo.png',
    'volkswagen': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
    'vw': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
    'porsche': 'https://www.carlogos.org/car-logos/porsche-logo.png',
    'opel': 'https://www.carlogos.org/car-logos/opel-logo.png',
    'ford': 'https://www.carlogos.org/car-logos/ford-logo.png',
    'skoda': 'https://www.carlogos.org/car-logos/skoda-logo.png',
    'toyota': 'https://www.carlogos.org/car-logos/toyota-logo.png',
    'honda': 'https://www.carlogos.org/car-logos/honda-logo.png',
    'nissan': 'https://www.carlogos.org/car-logos/nissan-logo.png',
    'hyundai': 'https://www.carlogos.org/car-logos/hyundai-logo.png',
    'mazda': 'https://www.carlogos.org/car-logos/mazda-logo.png',
    'volvo': 'https://www.carlogos.org/car-logos/volvo-logo.png',
    'peugeot': 'https://www.carlogos.org/car-logos/peugeot-logo.png',
    'renault': 'https://www.carlogos.org/car-logos/renault-logo.png',
    'seat': 'https://www.carlogos.org/car-logos/seat-logo.png',
    'fiat': 'https://www.carlogos.org/car-logos/fiat-logo.png',
    'kia': 'https://www.carlogos.org/car-logos/kia-logo.png',
    'subaru': 'https://www.carlogos.org/car-logos/subaru-logo.png',
    'mitsubishi': 'https://www.carlogos.org/car-logos/mitsubishi-logo.png',
    'suzuki': 'https://www.carlogos.org/car-logos/suzuki-logo.png',
    'citroen': 'https://www.carlogos.org/car-logos/citroen-logo.png',
    'alfa-romeo': 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png',
    'mini': 'https://www.carlogos.org/car-logos/mini-logo.png',
    'smart': 'https://www.carlogos.org/car-logos/smart-logo.png',
    'dacia': 'https://www.carlogos.org/car-logos/dacia-logo.png',
    'lada': 'https://www.carlogos.org/car-logos/lada-logo.png',
    'jeep': 'https://www.carlogos.org/car-logos/jeep-logo.png',
    'land-rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
    'jaguar': 'https://www.carlogos.org/car-logos/jaguar-logo.png',
    'lexus': 'https://www.carlogos.org/car-logos/lexus-logo.png',
    'infiniti': 'https://www.carlogos.org/car-logos/infiniti-logo.png',
  };

  const brandLower = brand.toLowerCase().trim();
  const logoUrl = logoMap[brandLower];

  if (!logoUrl) {
    return new NextResponse('Logo not found', { status: 404 });
  }

  try {
    // Fetch the logo from external source
    const response = await fetch(logoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch logo', { status: 500 });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return new NextResponse('Error fetching logo', { status: 500 });
  }
}

