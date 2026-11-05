// =============================================================
// lib/supabase/client.ts
// Supabase browser client — used by Client Components
//
// WHY THIS FILE EXISTS:
//   The Supabase JS library needs two things to connect to your
//   project: a URL and an "anon key" (a safe, public key).
//   We initialise it once here and export it so every component
//   that needs data can just import `supabase` from this file
//   instead of re-creating the connection every time.
//
//   IMPORTANT: This client runs in the user's BROWSER.
//   Never put secret keys (service_role key) here.
//   Only use the anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY).
// =============================================================

import { createClient } from '@supabase/supabase-js';

// These two values come from your Supabase project dashboard:
//   Project Settings → API → Project URL & anon public key
//
// They are stored in .env.local (never committed to git).
// NEXT_PUBLIC_ prefix = Next.js will include them in the browser bundle.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The `!` at the end tells TypeScript "trust me, this won't be undefined".
// If you forget to set these in .env.local, you'll get a runtime error
// that tells you exactly what's missing.

// createClient() sets up the connection to Supabase.
// We export it as a named export so components import it like:
//   import { supabase } from '@/lib/supabase/client'
// It is null when the env vars aren't set, so importing this file
// never crashes the build — check for null before using it.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
