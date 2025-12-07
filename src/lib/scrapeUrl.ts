/**
 * Advanced URL scraper with intelligent content and metadata extraction
 */
export interface ScrapedData {
  title: string;
  content: string;
  metadata?: {
    manufacturer?: string;
    partType?: string;
    partSeries?: string;
    sector?: string;
    tags?: string[];
    date?: string;
    metaDescription?: string;
  };
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  try {
    // Ensure URL is absolute
    let absoluteUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      absoluteUrl = `https://infoneva.com${url}`;
    }

    const response = await fetch(absoluteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title with multiple strategies
    let title = '';
    
    // Strategy 1: Meta og:title (most reliable)
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    }
    
    // Strategy 2: Meta title tag
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1]
          .replace(/\s*[-|]\s*.*$/, '')
          .trim();
      }
    }
    
    // Strategy 3: H1 tag
    if (!title) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        title = h1Match[1].trim();
      }
    }
    
    // Strategy 4: Meta name="title"
    if (!title) {
      const metaTitleMatch = html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i);
      if (metaTitleMatch) {
        title = metaTitleMatch[1].trim();
      }
    }

    // Extract metadata
    const metadata: ScrapedData['metadata'] = {};
    
    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDescMatch) {
      metadata.metaDescription = metaDescMatch[1].trim();
    }
    
    // Extract tags (common patterns)
    const tagMatches = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*property=["']article:tag["'][^>]*content=["']([^"']+)["']/i);
    if (tagMatches) {
      metadata.tags = tagMatches[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
    
    // Extract date
    const dateMatch = html.match(/<time[^>]*datetime=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/(?:Published|Date|Published on)[:\s]+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i);
    if (dateMatch) {
      metadata.date = dateMatch[1].trim();
    }
    
    // Try to extract manufacturer, part type, sector from structured data or content
    // Look for JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.manufacturer) {
          metadata.manufacturer = typeof jsonLd.manufacturer === 'string' 
            ? jsonLd.manufacturer 
            : jsonLd.manufacturer.name;
        }
        if (jsonLd.category) {
          metadata.sector = Array.isArray(jsonLd.category) ? jsonLd.category[0] : jsonLd.category;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
    
    // Extract from content patterns (look for metadata boxes/sections)
    const manufacturerMatch = html.match(/(?:Manufacturer|Brand)[:\s]+([A-Z][A-Za-z\s]+)/i);
    if (manufacturerMatch && !metadata.manufacturer) {
      metadata.manufacturer = manufacturerMatch[1].trim();
    }
    
    const partTypeMatch = html.match(/(?:Part Type|Type|Component)[:\s]+([A-Z][A-Za-z\s]+)/i);
    if (partTypeMatch) {
      metadata.partType = partTypeMatch[1].trim();
    }
    
    const sectorMatch = html.match(/(?:Sector|Industry|Category)[:\s]+([A-Z][A-Za-z\s]+)/i);
    if (sectorMatch && !metadata.sector) {
      metadata.sector = sectorMatch[1].trim();
    }

    // Extract main content with intelligent parsing
    let content = '';
    
    // Priority 1: Article tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      content = articleMatch[1];
    }
    
    // Priority 2: Main tag
    if (!content) {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        content = mainMatch[1];
      }
    }
    
    // Priority 3: Content-specific divs
    if (!content) {
      const contentPatterns = [
        /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*entry[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      ];
      
      for (const pattern of contentPatterns) {
        const match = html.match(pattern);
        if (match && match[1].length > 200) {
          content = match[1];
          break;
        }
      }
    }
    
    // Priority 4: Extract paragraphs from body
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        const pMatches = bodyMatch[1].match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
        if (pMatches && pMatches.length > 0) {
          content = pMatches.slice(0, 10).join(' ');
        }
      }
    }

    // Advanced HTML cleaning and text extraction
    let cleanContent = content;
    
    cleanContent = cleanContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
      .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '$1')
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '$1')
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '$1')
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '$1')
      .replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, '')
      .replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '$1. ')
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '$1. ')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '...')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Extract meaningful content
    const lines = cleanContent.split('\n')
      .map(line => line.trim())
      .filter(line => {
        return line.length > 20 && 
               !line.match(/^(home|about|contact|privacy|terms|cookie|menu|navigation|skip to)/i) &&
               !line.match(/^[0-9\s\-\(\)]+$/) &&
               !line.match(/^(click|read more|learn more|view|see|show|hide)/i);
      })
      .slice(0, 30);
    
    cleanContent = lines.join(' ');

    // If no title found, extract from URL or use first sentence
    if (!title) {
      const urlParts = absoluteUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || '';
      
      if (lastPart) {
        try {
          title = decodeURIComponent(lastPart)
            .replace(/[-_]/g, ' ')
            .replace(/\.[^.]+$/, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        } catch {
          title = lastPart.replace(/[-_]/g, ' ');
        }
      }
      
      if (!title && cleanContent) {
        const firstSentence = cleanContent.split(/[.!?]/)[0];
        if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
          title = firstSentence.trim();
        }
      }
      
      if (!title) {
        title = 'Knowledge Entry';
      }
    }

    // Clean title
    title = title
      .replace(/\s*[-|]\s*.*$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure we have meaningful content
    if (!cleanContent || cleanContent.length < 50) {
      cleanContent = 'No substantial content found on this page.';
    }

    return {
      title: title || 'Knowledge Entry',
      content: cleanContent || 'No content found',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  } catch (error) {
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
