// =============================================================
// lib/supabase/server.ts
// Supabase server client — used by Route Handlers & Server Components
//
// WHY A SEPARATE FILE FROM client.ts?
//   The browser client and server client are configured slightly
//   differently. The server client can safely read cookies (for
//   future auth), while the browser client manages its own session.
//   Keeping them separate prevents accidentally leaking server-only
//   logic into the browser bundle.
//
//   This file uses 'server-only' to cause a build error if you
//   accidentally import it into a Client Component.
// =============================================================

// 'server-only' is a Next.js convention package.
// If any Client Component tries to import this file, the build
// will fail with a clear error message. This protects us from
// accidentally sending server secrets to the browser.
import 'server-only';

import { createClient } from '@supabase/supabase-js';

// On the server we can use the same anon key — the difference is
// that server Route Handlers run with full Node.js access and
// never expose these values to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True when both Supabase env vars are set. When false, the API
// routes fall back to sample data (see ./sample-data.ts) instead
// of crashing, so the app still builds and runs.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// We export a *function* (not a singleton) so each server request
// gets a fresh client. This matters for future auth where each
// request may have a different user session via cookies.
export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // On the server we don't want Supabase to try to persist
      // sessions in localStorage (that's browser-only).
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
