import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KindMindProvider, useKindMind } from '@/providers/KindMindProvider';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { session, isLoading: authLoading } = useAuth();
  const { data, isLoading: dataLoading } = useKindMind();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || dataLoading) return;

    const inAuthGroup = segments[0] === 'auth' as string;
    const inOnboarding = segments[0] === 'onboarding' as string;
    const inWelcome = segments[0] === 'welcome' as string;
    const inTabs = segments[0] === '(tabs)';

    if (!session) {
      if (!inAuthGroup && !inWelcome) {
        router.replace('/welcome' as any);
      }
    } else {
      if (inAuthGroup || inWelcome) {
        if (!data.hasCompletedOnboarding) {
          router.replace('/onboarding' as any);
        } else {
          router.replace('/(tabs)');
        }
      } else if (!data.hasCompletedOnboarding && !inOnboarding) {
        router.replace('/onboarding' as any);
      } else if (data.hasCompletedOnboarding && !inTabs) {
        router.replace('/(tabs)');
      }
    }
  }, [session, authLoading, data.hasCompletedOnboarding, dataLoading, segments, router]);

  useEffect(() => {
    if (!authLoading && !dataLoading) {
      SplashScreen.hideAsync();
    }
  }, [authLoading, dataLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <KindMindProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
          </KindMindProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
