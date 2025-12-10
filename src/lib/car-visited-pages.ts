/**
 * Utility for tracking and managing visited car pages using localStorage
 * Maintains a list of the last 5 visited car faults/manuals (FIFO - First In First Out)
 */

export interface VisitedCarPage {
  slug: string;
  title: string;
  url: string;
  visitedAt: string; // ISO timestamp
  type: 'fault' | 'manual';
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  generation: string;
  generationSlug: string;
  lang: 'en' | 'de';
}

const STORAGE_KEY = 'faultbase_car_visited_pages';
const MAX_PAGES = 5;

/**
 * Get all visited car pages from localStorage
 */
export function getVisitedCarPages(): VisitedCarPage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const pages: VisitedCarPage[] = JSON.parse(stored);
    // Sort by visitedAt descending (most recent first)
    return pages.sort((a, b) => 
      new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
    );
  } catch (error) {
    console.error('Error reading visited car pages from localStorage:', error);
    return [];
  }
}

/**
 * Add or update a visited car page
 * If the page already exists, update its timestamp
 * If it's a new page and we have 5, remove the oldest
 */
export function addVisitedCarPage(page: Omit<VisitedCarPage, 'visitedAt'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingPages = getVisitedCarPages();
    
    // Check if this page already exists (by slug, type, and generation)
    const existingIndex = existingPages.findIndex(
      p => p.slug === page.slug && 
           p.type === page.type && 
           p.generationSlug === page.generationSlug &&
           p.lang === page.lang
    );
    
    let updatedPages: VisitedCarPage[];
    
    if (existingIndex !== -1) {
      // Page exists - remove it and add to front (update timestamp)
      updatedPages = [
        { ...page, visitedAt: new Date().toISOString() },
        ...existingPages.filter((_, i) => i !== existingIndex)
      ];
    } else {
      // New page - add to front
      const newPage: VisitedCarPage = {
        ...page,
        visitedAt: new Date().toISOString()
      };
      
      updatedPages = [newPage, ...existingPages];
      
      // If we have more than MAX_PAGES, remove the oldest (last in array)
      if (updatedPages.length > MAX_PAGES) {
        updatedPages = updatedPages.slice(0, MAX_PAGES);
      }
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPages));
  } catch (error) {
    console.error('Error saving visited car page to localStorage:', error);
  }
}

/**
 * Clear all visited car pages
 */
export function clearVisitedCarPages(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing visited car pages from localStorage:', error);
  }
}

/**
 * Remove a specific visited car page
 */
export function removeVisitedCarPage(slug: string, type: 'fault' | 'manual', generationSlug: string, lang: 'en' | 'de'): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingPages = getVisitedCarPages();
    const updatedPages = existingPages.filter(
      p => !(p.slug === slug && p.type === type && p.generationSlug === generationSlug && p.lang === lang)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPages));
  } catch (error) {
    console.error('Error removing visited car page from localStorage:', error);
  }
}







