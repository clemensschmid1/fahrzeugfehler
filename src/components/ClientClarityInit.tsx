'use client';

import { useEffect } from 'react';

export default function ClientClarityInit() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@microsoft/clarity').then((Clarity) => {
        if (Clarity && typeof Clarity.default?.init === 'function') {
          Clarity.default.init('sigphxs9mi');
        }
      });
    }
  }, []);
  return null;
} 