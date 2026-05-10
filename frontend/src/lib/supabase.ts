import { createClient } from "@supabase/supabase-js";

// Use environment variables for Supabase configuration
// These should be defined in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
