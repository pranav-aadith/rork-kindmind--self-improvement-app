import { router } from 'expo-router';
import { Target, Brain, Sparkles, ArrowRight, X } from 'lucide-react-native';
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

const FEATURES = [
  { icon: Target, label: 'Track Triggers', desc: 'Understand your reactions', color: '#B5A8D6' },
  { icon: Brain, label: 'Practice Pauses', desc: 'Respond with intention', color: '#8DC8C4' },
  { icon: Sparkles, label: 'Build Habits', desc: 'Grow kinder each day', color: '#EDD9B8' },
];

type ModalType = 'terms' | 'privacy' | null;

export default function WelcomeScreen() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
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
              By continuing you agree to our{' '}
              <Text style={styles.link} onPress={() => setActiveModal('terms')}>Terms</Text>
              {' & '}
              <Text style={styles.link} onPress={() => setActiveModal('privacy')}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>

      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)} />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setActiveModal(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color="#4A4545" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {activeModal === 'terms' ? (
                <View style={styles.legalContent}>
                  <Text style={styles.sectionTitle}>1. Account Registration & Credentials</Text>
                  <Text style={styles.sectionText}>
                    You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.
                  </Text>

                  <Text style={styles.sectionTitle}>2. Onboarding & Personalization Data</Text>
                  <Text style={styles.sectionText}>
                    During onboarding, we collect preferences and goals to personalize your experience. This data helps us tailor content, prompts, and recommendations to your needs.
                  </Text>

                  <Text style={styles.sectionTitle}>3. Journaling</Text>
                  <Text style={styles.sectionText}>
                    Journal entries you create are stored securely. AI-generated prompts are provided to inspire reflection but are not a substitute for professional advice. You retain ownership of your journal content.
                  </Text>

                  <Text style={styles.sectionTitle}>4. Kora AI Coach</Text>
                  <Text style={styles.sectionText}>
                    Kora is an AI wellness companion designed to support emotional awareness. Kora is NOT a licensed therapist, counselor, or medical professional. Kora's responses are for informational and supportive purposes only and should not be considered medical, psychological, or professional advice.
                  </Text>

                  <Text style={styles.sectionTitle}>5. Voice Input & Transcription</Text>
                  <Text style={styles.sectionText}>
                    When you use voice input, your audio is processed for transcription. Voice data is handled according to our Privacy Policy and is not stored permanently unless explicitly stated.
                  </Text>

                  <Text style={styles.sectionTitle}>6. Daily Check-ins & Behavioral Tracking</Text>
                  <Text style={styles.sectionText}>
                    Check-ins help you track mood, energy, and daily patterns. This data is used to provide insights and personalized recommendations within the app.
                  </Text>

                  <Text style={styles.sectionTitle}>7. Trigger Logging</Text>
                  <Text style={styles.sectionText}>
                    You may log emotional triggers to identify patterns. This information is private and used solely to help you understand your emotional responses.
                  </Text>

                  <Text style={styles.sectionTitle}>8. Pause/Breathing Exercises</Text>
                  <Text style={styles.sectionText}>
                    Breathing exercises are provided as wellness tools. They are not medical treatments and should not replace professional care for respiratory or anxiety conditions.
                  </Text>

                  <Text style={styles.sectionTitle}>9. Meditation Timer</Text>
                  <Text style={styles.sectionText}>
                    The meditation timer is a utility feature. We do not make claims about health benefits; use meditation practices at your own discretion.
                  </Text>

                  <Text style={styles.sectionTitle}>10. Progress & Analytics</Text>
                  <Text style={styles.sectionText}>
                    We provide analytics based on your usage to help you track personal growth. These insights are generated from your data and remain private to you.
                  </Text>

                  <Text style={styles.sectionTitle}>11. User Content Ownership</Text>
                  <Text style={styles.sectionText}>
                    You retain full ownership of all content you create, including journal entries, notes, and logged data. We do not claim any intellectual property rights over your content.
                  </Text>

                  <Text style={styles.sectionTitle}>12. Prohibited Use</Text>
                  <Text style={styles.sectionText}>
                    You may not use KindMind for any unlawful purpose, to harass others, to distribute harmful content, or to attempt to compromise the security of our services.
                  </Text>

                  <Text style={styles.sectionTitle}>13. Disclaimer of Warranties</Text>
                  <Text style={styles.sectionText}>
                    KindMind is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access, error-free operation, or specific outcomes from using the app.
                  </Text>

                  <Text style={styles.sectionTitle}>14. Limitation of Liability</Text>
                  <Text style={styles.sectionText}>
                    To the fullest extent permitted by law, KindMind shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.
                  </Text>

                  <Text style={styles.sectionTitle}>15. Changes to Terms</Text>
                  <Text style={styles.sectionText}>
                    We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
                  </Text>

                  <Text style={styles.sectionTitle}>16. Governing Law</Text>
                  <Text style={styles.sectionText}>
                    These terms are governed by applicable laws in your jurisdiction. Any disputes shall be resolved through appropriate legal channels.
                  </Text>

                  <Text style={styles.sectionTitle}>17. Contact</Text>
                  <Text style={styles.sectionText}>
                    For questions about these Terms of Service, please contact us through the app's support feature.
                  </Text>
                </View>
              ) : (
                <View style={styles.legalContent}>
                  <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                  <Text style={styles.sectionText}>
                    We collect information you provide directly, including: account information (email, name), onboarding preferences and goals, journal entries and AI-generated prompts, Kora conversation history, daily check-in data, trigger logs, and usage analytics.
                  </Text>

                  <Text style={styles.sectionTitle}>2. What We Do NOT Collect</Text>
                  <Text style={styles.sectionText}>
                    We do not collect: precise location data, contacts or address book, photos or media (unless you explicitly share), biometric data, or financial information beyond what's needed for purchases.
                  </Text>

                  <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
                  <Text style={styles.sectionText}>
                    Your data is used to: personalize your experience, provide AI-powered features, generate insights and progress reports, improve our services, and communicate important updates.
                  </Text>

                  <Text style={styles.sectionTitle}>4. Data Storage & Security</Text>
                  <Text style={styles.sectionText}>
                    Data is stored using industry-standard security measures. Local data is stored on your device. Account authentication is handled through Supabase with secure protocols. We use encryption for data in transit and at rest.
                  </Text>

                  <Text style={styles.sectionTitle}>5. Voice & Microphone Usage</Text>
                  <Text style={styles.sectionText}>
                    Voice input is used only when you activate the microphone feature. Audio is processed for transcription and is not stored permanently. You can disable microphone access at any time through your device settings.
                  </Text>

                  <Text style={styles.sectionTitle}>6. AI-Generated Content</Text>
                  <Text style={styles.sectionText}>
                    AI features process your input to generate responses, prompts, and insights. This processing may involve third-party AI providers who are contractually bound to protect your data.
                  </Text>

                  <Text style={styles.sectionTitle}>7. Haptics & Device Features</Text>
                  <Text style={styles.sectionText}>
                    We use haptic feedback to enhance your experience during breathing exercises and interactions. No data is collected from haptic usage.
                  </Text>

                  <Text style={styles.sectionTitle}>8. Your Rights & Control</Text>
                  <Text style={styles.sectionText}>
                    You have the right to: access your data, request data deletion, export your data, opt out of non-essential data collection, and close your account at any time.
                  </Text>

                  <Text style={styles.sectionTitle}>9. Children's Privacy (COPPA)</Text>
                  <Text style={styles.sectionText}>
                    KindMind is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover such data has been collected, we will delete it promptly.
                  </Text>

                  <Text style={styles.sectionTitle}>10. Third-Party Services</Text>
                  <Text style={styles.sectionText}>
                    We use third-party services including: Supabase for authentication and data storage, speech-to-text providers for voice transcription, and AI providers for intelligent features. These services have their own privacy policies.
                  </Text>

                  <Text style={styles.sectionTitle}>11. Changes to Privacy Policy</Text>
                  <Text style={styles.sectionText}>
                    We may update this policy periodically. We will notify you of significant changes through the app or via email. Continued use after changes constitutes acceptance.
                  </Text>

                  <Text style={styles.sectionTitle}>12. Contact Us</Text>
                  <Text style={styles.sectionText}>
                    For privacy-related questions or to exercise your data rights, please contact us through the app's support feature or settings menu.
                  </Text>
                </View>
              )}
              <View style={styles.modalBottomPadding} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  link: {
    color: '#8A8585',
    textDecorationLine: 'underline' as const,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#4A4545',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EFE8',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  legalContent: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#4A4545',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#6A6565',
    lineHeight: 21,
  },
  modalBottomPadding: {
    height: 40,
  },
});
