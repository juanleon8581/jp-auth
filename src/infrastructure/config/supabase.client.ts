import { createClient } from "@supabase/supabase-js";
import envs from "@/config/envs";

export const supabase = createClient(
  envs.SUPABASE_URL,
  envs.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
    },
  }
);
