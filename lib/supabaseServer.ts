// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

// ВАЖНО: именно SERVICE_ROLE, не публичный anon.
// Эти переменные должны быть в .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
