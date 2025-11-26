'use client';

import { useState, useEffect, ReactNode, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

export default function UserSessionProvider({ children }: { children: ReactNode }) {
  // User state is managed internally but not exposed
  const [, setUser] = useState<User | null>(null);
  const supabase = useMemo(() => getSupabaseClient(), []);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        const err = error as Error;
        if (err.message !== 'Auth session missing!') {
          console.error('Auth session error in layout:', err);
        }
        setUser(null);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, pathname, router]);

  return <>{children}</>;
} 