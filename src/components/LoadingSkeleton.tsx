'use client';

import { memo } from 'react';

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
      </div>
    </div>
  );
});

export const GridSkeleton = memo(function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
});

export const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center animate-pulse">
          <div className="h-12 bg-slate-700 dark:bg-slate-800 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-8 bg-slate-700 dark:bg-slate-800 rounded w-1/4 mx-auto mb-6"></div>
          <div className="h-4 bg-slate-700 dark:bg-slate-800 rounded w-1/5 mx-auto"></div>
        </div>
      </div>
    </div>
  );
});

export const ListSkeleton = memo(function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 animate-pulse">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
});

