import { createBrowserClient } from '@supabase/ssr'

// Helper function for runtime check (prevents build-time errors)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Provide helpful error message
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(', ')}. ` +
      `Please check your .env.local file or Vercel environment variables. ` +
      `See https://supabase.com/dashboard/project/_/settings/api`
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Lazy getter for backward compatibility with existing imports
// This creates a proxy that calls getSupabaseClient() when accessed
// This prevents build-time errors while maintaining compatibility
let _supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    if (!_supabaseClient) {
      _supabaseClient = getSupabaseClient();
    }
    const client = _supabaseClient;
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
}); 