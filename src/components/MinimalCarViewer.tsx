'use client';

interface MinimalCarViewerProps {
  modelPath: string;
  className?: string;
}

/**
 * Minimalistic 3D car model viewer placeholder
 * This is a simplified version that doesn't require heavy 3D dependencies
 * For full 3D functionality, install: @react-three/fiber, @react-three/drei, three
 */
export default function MinimalCarViewer({ modelPath, className = '' }: MinimalCarViewerProps) {
  return (
    <div className={`relative w-full aspect-video bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-800 ${className}`} style={{ minHeight: '500px' }}>
      {/* Placeholder content - Modern and minimalistic */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {/* Car icon placeholder */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg 
              className="w-full h-full text-slate-300 dark:text-slate-700" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
              />
            </svg>
            {/* Animated ring */}
            <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
            3D Model Viewer
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Interactive 3D car model viewer coming soon. For now, explore the car generations below.
          </p>
        </div>
      </div>
      
      {/* Decorative gradient overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-500/5 to-transparent rounded-br-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-orange-500/5 to-transparent rounded-tl-full"></div>
    </div>
  );
}


