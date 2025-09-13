import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://vesmleiliahbfqpcjtix.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc21sZWlsaWFoYmZxcGNqdGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2NDQsImV4cCI6MjA3MjM5OTY0NH0.N5ePU-NWW2FxhG9y3oVTHAXSZHymuC5JtRRYQcnpm6k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
