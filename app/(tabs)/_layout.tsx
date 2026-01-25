import { Tabs, Redirect } from 'expo-router';
import { Home, LineChart, BookOpen, User, History } from 'lucide-react-native';
import React from 'react';
import Colors from '@/constants/colors';
import { useKindMind } from '@/providers/KindMindProvider';

export default function TabLayout() {
  const { data } = useKindMind();

  if (!data.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 6,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <LineChart color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="responses"
        options={{
          title: 'Kora',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <History color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="pause"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="trigger"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="meditation"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
