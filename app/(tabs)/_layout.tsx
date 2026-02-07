import { Tabs, Redirect } from 'expo-router';
import { Home, BarChart3, MessageCircle, User, Clock, ListTodo } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
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
        tabBarActiveTintColor: Colors.light.text,
        tabBarInactiveTintColor: Colors.light.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopColor: Colors.light.border,
          borderTopWidth: 0.5,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 0 : 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size - 2} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="responses"
        options={{
          title: 'Kora',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size - 2} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size - 2} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <ListTodo color={color} size={size - 2} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={2.2} />,
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
