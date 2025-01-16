// src/lib/auth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
      }
    };
    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token has been refreshed');
      }
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { signOut };
};