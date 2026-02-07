import createContextHook from '@nkzw/create-context-hook';
import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const clearInvalidSession = async () => {
    console.log('[Auth] Clearing invalid session...');
    try {
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(key => key.includes('supabase'));
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        console.log('[Auth] Cleared supabase storage keys');
      }
    } catch (e) {
      console.log('[Auth] Error clearing storage:', e);
    }
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.log('[Auth] signOut error (expected):', e);
    }
    setSession(null);
    setUser(null);
  };

  const isRefreshTokenError = (error: any): boolean => {
    const message = error?.message || String(error);
    return (
      message.includes('Refresh Token') ||
      message.includes('refresh_token') ||
      message.includes('Invalid Refresh Token') ||
      message.includes('Refresh Token Not Found')
    );
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.log('[Auth] getSession error:', error.message);
        if (isRefreshTokenError(error)) {
          await clearInvalidSession();
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    }).catch(async (err) => {
      console.log('[Auth] getSession unexpected error:', err);
      if (isRefreshTokenError(err)) {
        await clearInvalidSession();
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event);
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('[Auth] Token refresh failed, clearing session');
        await clearInvalidSession();
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
    }
    await clearInvalidSession();
  };

  return {
    session,
    user,
    isLoading,
    signOut,
  };
});
