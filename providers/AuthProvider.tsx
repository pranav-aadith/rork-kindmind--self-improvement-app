import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Found session' : 'No session');
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session ? 'Has session' : 'No session');
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (username: string, password: string) => {
    console.log('Attempting signup for:', username);
    
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@kindmind.app`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          display_name: username,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      throw error;
    }

    console.log('Signup successful:', data.user?.id);
    return data;
  };

  const signIn = async (username: string, password: string) => {
    console.log('Attempting signin for:', username);
    
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@kindmind.app`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Signin error:', error.message);
      throw error;
    }

    console.log('Signin successful:', data.user?.id);
    return data;
  };

  const signOut = async () => {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Signout error:', error.message);
      throw error;
    }
    console.log('Signout successful');
  };

  const getUsername = () => {
    return state.user?.user_metadata?.username || state.user?.user_metadata?.display_name || 'User';
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    getUsername,
  };
});
