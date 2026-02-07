import { router } from 'expo-router';
import { Target, Brain, Sparkles, ArrowRight } from 'lucide-react-native';
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

const FEATURES = [
  { icon: Target, label: 'Track Triggers', desc: 'Understand your reactions', color: '#B5A8D6' },
  { icon: Brain, label: 'Practice Pauses', desc: 'Respond with intention', color: '#8DC8C4' },
  { icon: Sparkles, label: 'Build Habits', desc: 'Grow kinder each day', color: '#EDD9B8' },
];

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const featureAnim0 = useRef(new Animated.Value(0)).current;
  const featureAnim1 = useRef(new Animated.Value(0)).current;
  const featureAnim2 = useRef(new Animated.Value(0)).current;
  const featureAnims = [featureAnim0, featureAnim1, featureAnim2];
  const footerFade = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 45, friction: 9, useNativeDriver: true }),
      ]),
      Animated.stagger(120, featureAnims.map(a =>
        Animated.spring(a, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true })
      )),
      Animated.timing(footerFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, footerFade, featureAnim0, featureAnim1, featureAnim2]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true, friction: 5 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  const handleContinue = () => {
    router.replace('/auth/login');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoWrap}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/7qm5e9owkjmxhy6fn577g' }}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.brand}>KindMind</Text>
            <Text style={styles.tagline}>
              Build emotional awareness{'\n'}with gentle self-compassion
            </Text>
          </Animated.View>

          <View style={styles.featuresList}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Animated.View
                  key={f.label}
                  style={[
                    styles.featureRow,
                    {
                      opacity: featureAnims[i],
                      transform: [{ translateX: featureAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                    },
                  ]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                    <Icon size={22} color={f.color} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View style={[styles.footerArea, { opacity: footerFade }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleContinue}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                testID="welcome-cta"
              >
                <Text style={styles.ctaText}>Get Started</Text>
                <ArrowRight color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.termsText}>
              By continuing you agree to our Terms & Privacy Policy
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5EFE8',
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  logo: {
    width: 96,
    height: 96,
  },
  brand: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#4A4545',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 17,
    color: '#8A8585',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  featuresList: {
    gap: 14,
    paddingVertical: 8,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4A4545',
  },
  featureDesc: {
    fontSize: 14,
    color: '#8A8585',
  },
  footerArea: {
    alignItems: 'center',
    gap: 14,
  },
  ctaButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.light.primary,
    height: 58,
    borderRadius: 16,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  termsText: {
    fontSize: 12,
    color: '#B0ABAB',
    textAlign: 'center',
  },
});
