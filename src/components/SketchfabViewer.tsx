'use client';

import { useEffect, useRef } from 'react';

// Simple translation function (can be enhanced with proper i18n)
const t = (en: string, de: string) => {
  if (typeof window === 'undefined') return en;
  const lang = document.documentElement.lang || 'en';
  return lang === 'de' ? de : en;
};

interface SketchfabViewerProps {
  modelId: string;
  title?: string;
  className?: string;
}

/**
 * Modern, minimalistic Sketchfab 3D model viewer
 * Removes default Sketchfab branding for a cleaner look
 */
export default function SketchfabViewer({ modelId, title, className = '' }: SketchfabViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create iframe with minimalistic styling
    const iframe = document.createElement('iframe');
    iframe.title = title || '3D Model';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '1rem';
    iframe.allowFullscreen = true;
    iframe.setAttribute('mozallowfullscreen', 'true');
    iframe.setAttribute('webkitallowfullscreen', 'true');
    iframe.setAttribute('allow', 'autoplay; fullscreen; xr-spatial-tracking');
    iframe.setAttribute('xr-spatial-tracking', '');
    iframe.setAttribute('execution-while-out-of-viewport', '');
    iframe.setAttribute('execution-while-not-rendered', '');
    iframe.setAttribute('web-share', '');
    
    // Embed URL with minimal UI parameters for sleek, minimalistic look
    // autostart=0: Don't auto-play
    // autospin=0.2: Slow auto-rotate for elegance
    // ui_theme=dark: Dark theme for modern look
    // ui_controls=1: Show basic controls
    // ui_infos=0: Hide info overlay
    // ui_watermark=0: Hide watermark
    // ui_help=0: Hide help
    // ui_settings=0: Hide settings
    // ui_fullscreen=1: Allow fullscreen
    // ui_annotations=0: Hide annotations
    const embedUrl = `https://sketchfab.com/models/${modelId}/embed?autostart=0&autospin=0.2&camera=0&preload=1&ui_theme=dark&ui_controls=1&ui_infos=0&ui_stop=0&ui_watermark=0&ui_help=0&ui_settings=0&ui_fullscreen=1&ui_annotations=0&transparent=0`;
    iframe.src = embedUrl;

    containerRef.current.appendChild(iframe);

    // Hide loading placeholder when iframe loads
    const hideLoading = () => {
      const loadingEl = document.getElementById('sketchfab-loading');
      if (loadingEl) {
        loadingEl.style.opacity = '0';
        setTimeout(() => {
          loadingEl.style.display = 'none';
        }, 500);
      }
    };

    iframe.onload = hideLoading;
    // Fallback: hide after 3 seconds
    setTimeout(hideLoading, 3000);

    return () => {
      if (containerRef.current && iframe.parentNode) {
        containerRef.current.removeChild(iframe);
      }
    };
  }, [modelId, title]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-800 ${className}`}
      style={{ minHeight: '500px' }}
    >
      {/* Loading placeholder - Modern minimalistic */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 z-10 transition-opacity duration-500" id="sketchfab-loading">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-bold text-lg tracking-wide">
            {t('Loading 3D Model...', '3D-Modell wird geladen...')}
          </p>
        </div>
      </div>
    </div>
  );
}

