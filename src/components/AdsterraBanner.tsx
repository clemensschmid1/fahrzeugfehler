'use client';

import { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  className?: string;
  position?: 'sidebar' | 'inline' | 'sticky';
}

/**
 * Adsterra Vertical Banner Component (300x250)
 * Optimized for both desktop and mobile
 * Uses iframe format for better performance
 */
export default function AdsterraBanner({ className = '', position = 'inline' }: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Only load script once globally
    if (scriptLoadedRef.current || typeof window === 'undefined') return;

    // Set atOptions before script loads (required by Adsterra)
    if (!(window as any).atOptions) {
      (window as any).atOptions = {
        'key': '2dce448c8e1415c758934da189bdcc5e',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };
    }

    // Wait for container to be ready
    const loadScript = () => {
      // Check if script already exists globally
      const existingScript = document.querySelector('script[src*="abackmentor.com/2dce448c8e1415c758934da189bdcc5e/invoke.js"]');
      
      if (!existingScript) {
        // Load the invoke script (only once globally)
        const script = document.createElement('script');
        script.src = 'https://abackmentor.com/2dce448c8e1415c758934da189bdcc5e/invoke.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      scriptLoadedRef.current = true;
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadScript, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Determine container classes based on position
  const containerClasses = {
    sidebar: 'w-full max-w-[300px] mx-auto',
    inline: 'w-full max-w-[300px] mx-auto my-6',
    sticky: 'w-full max-w-[300px] mx-auto sticky top-20'
  };

  return (
    <div 
      ref={containerRef}
      className={`adsterra-banner-container ${containerClasses[position]} ${className}`}
      style={{ 
        minHeight: '250px',
        width: '100%',
        maxWidth: '300px'
      }}
    >
      {/* Ad container - Adsterra script will inject iframe here */}
      <div 
        id="adsterra-banner-2dce448c8e1415c758934da189bdcc5e"
        className="w-full"
        style={{ 
          minHeight: '250px', 
          width: '100%', 
          maxWidth: '300px',
          margin: '0 auto'
        }}
      />
    </div>
  );
}

