import { router } from 'expo-router';
import { Target, Brain, Sparkles, ChevronRight } from 'lucide-react-native';
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Animated,
} from 'react-native';
import Colors from '@/constants/colors';

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleContinue = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/auth/login');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/7qm5e9owkjmxhy6fn577g' }}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.title}>Welcome to KindMind</Text>
          <Text style={styles.subtitle}>
            Your personal tool for building emotional awareness and kinder communication
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Target size={28} color={Colors.light.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Track Triggers</Text>
                <Text style={styles.featureDescription}>Understand what causes reactions</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Brain size={28} color={Colors.light.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practice Pauses</Text>
                <Text style={styles.featureDescription}>Learn to respond mindfully</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Sparkles size={28} color={Colors.light.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Build Habits</Text>
                <Text style={styles.featureDescription}>Develop kinder communication</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Create an account to get started on your journey to emotional wellness.
            </Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Get Started</Text>
              <ChevronRight size={24} color={Colors.light.card} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  features: {
    marginTop: 32,
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 20,
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  featureTextContainer: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  featureDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    backgroundColor: '#FFF0ED',
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 32,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonText: {
    color: Colors.light.card,
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
