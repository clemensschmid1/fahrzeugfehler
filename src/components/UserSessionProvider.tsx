'use client';

import { useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function UserSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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