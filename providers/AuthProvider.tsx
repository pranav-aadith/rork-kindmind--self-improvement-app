import createContextHook from '@nkzw/create-context-hook';
import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log('[Auth] getSession error:', error.message);
        if (
          error.message?.includes('Refresh Token') ||
          error.message?.includes('refresh_token') ||
          error.message?.includes('Invalid Refresh Token')
        ) {
          console.log('[Auth] Invalid refresh token, signing out...');
          supabase.auth.signOut().catch(() => {});
          setSession(null);
          setUser(null);
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.log('[Auth] getSession unexpected error:', err);
      supabase.auth.signOut().catch(() => {});
      setSession(null);
      setUser(null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event);
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('[Auth] Token refresh failed, clearing session');
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('[Auth] Sign out error, forcing clear:', error);
      setSession(null);
      setUser(null);
    }
  };

  return {
    session,
    user,
    isLoading,
    signOut,
  };
});
