/**
 * Utility for tracking and managing visited pages using localStorage
 * Maintains a list of the last 5 visited pages (FIFO - First In First Out)
 */

export interface VisitedPage {
  slug: string;
  title: string;
  url: string;
  visitedAt: string; // ISO timestamp
  type: 'knowledge' | 'news';
  lang: 'en' | 'de';
}

const STORAGE_KEY = 'faultbase_visited_pages';
const MAX_PAGES = 5;

/**
 * Get all visited pages from localStorage
 */
export function getVisitedPages(): VisitedPage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const pages: VisitedPage[] = JSON.parse(stored);
    // Sort by visitedAt descending (most recent first)
    return pages.sort((a, b) => 
      new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
    );
  } catch (error) {
    console.error('Error reading visited pages from localStorage:', error);
    return [];
  }
}

/**
 * Add or update a visited page
 * If the page already exists, update its timestamp
 * If it's a new page and we have 5, remove the oldest
 */
export function addVisitedPage(page: Omit<VisitedPage, 'visitedAt'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingPages = getVisitedPages();
    
    // Check if this page already exists (by slug and type)
    const existingIndex = existingPages.findIndex(
      p => p.slug === page.slug && p.type === page.type && p.lang === page.lang
    );
    
    let updatedPages: VisitedPage[];
    
    if (existingIndex !== -1) {
      // Page exists - remove it and add to front (update timestamp)
      updatedPages = [
        { ...page, visitedAt: new Date().toISOString() },
        ...existingPages.filter((_, i) => i !== existingIndex)
      ];
    } else {
      // New page - add to front
      const newPage: VisitedPage = {
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
    console.error('Error saving visited page to localStorage:', error);
  }
}

/**
 * Clear all visited pages
 */
export function clearVisitedPages(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing visited pages from localStorage:', error);
  }
}

/**
 * Remove a specific visited page
 */
export function removeVisitedPage(slug: string, type: 'knowledge' | 'news', lang: 'en' | 'de'): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingPages = getVisitedPages();
    const updatedPages = existingPages.filter(
      p => !(p.slug === slug && p.type === type && p.lang === lang)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPages));
  } catch (error) {
    console.error('Error removing visited page from localStorage:', error);
  }
}







