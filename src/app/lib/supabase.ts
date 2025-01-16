// src/app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: {
      getItem: (key) => {
        try {
          if (!isBrowser) return null;
          const itemStr = window.localStorage.getItem(key);
          if (!itemStr) return null;
          return JSON.parse(itemStr);
        } catch (err) {
          console.error('Error reading auth from storage:', err);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          if (!isBrowser) return;
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
          console.error('Error saving auth to storage:', err);
        }
      },
      removeItem: (key) => {
        try {
          if (!isBrowser) return;
          window.localStorage.removeItem(key);
        } catch (err) {
          console.error('Error removing auth from storage:', err);
        }
      }
    }
  }
});