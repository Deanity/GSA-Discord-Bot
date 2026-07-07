import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { Database } from '../types/database.types.js';
import ws from 'ws';

// Define WebSocket globally for environments without native WebSocket support (like Node.js 20)
// This is required for @supabase/supabase-js realtime features when running on Node < 22
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
}

// Initialize Supabase Client with strict type safety using Database interfaces
// Using service role key for backend administration
export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false, // stateless bot, no local session persistence needed
    },
  }
);
