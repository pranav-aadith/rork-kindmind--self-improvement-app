import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, formFade, formSlide]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, friction: 5 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Missing Fields', 'Please fill in all fields to continue.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Your password needs at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      console.log('[Auth] Attempting signup with:', email.trim().toLowerCase());
      const { data: { session, user }, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        console.log('[Auth] Signup error:', error.message, error.status);
        throw error;
      }

      console.log('[Auth] Signup result - user:', !!user, 'session:', !!session);

      if (user && !session) {
        console.log('[Auth] No session after signup, attempting auto-login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (loginError) {
          console.log('[Auth] Auto-login failed:', loginError.message);
          Alert.alert('Account Created', 'Check your email to verify, then sign in.');
          router.push('/auth/login');
        } else {
          console.log('[Auth] Auto-login success, session:', !!loginData.session);
        }
      }
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Get started</Text>
              </View>
              <Text style={styles.title}>Create your{'\n'}account</Text>
              <Text style={styles.subtitle}>Begin your journey to a kinder mind</Text>
            </Animated.View>

            <Animated.View style={[styles.form, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputWrap, focusedField === 'name' && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Jane Doe"
                    placeholderTextColor="#B0ABAB"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    testID="signup-name"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#B0ABAB"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    testID="signup-email"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#B0ABAB"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    testID="signup-password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff color="#9A9590" size={20} />
                    ) : (
                      <Eye color="#9A9590" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignup}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={loading}
                  activeOpacity={1}
                  testID="signup-button"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Text style={styles.buttonText}>Create Account</Text>
                      <ArrowRight color="#fff" size={18} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.linkText}>Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#D6EDE8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6BA09A',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: '#4A4545',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8585',
    lineHeight: 22,
  },
  form: {
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6A6565',
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  inputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#E5DDD4',
  },
  inputFocused: {
    borderColor: '#8DC8C4',
    backgroundColor: '#FDFCFB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#4A4545',
    letterSpacing: 0.1,
  },
  button: {
    backgroundColor: '#8DC8C4',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 36,
  },
  footerText: {
    fontSize: 15,
    color: '#8A8585',
  },
  linkText: {
    fontSize: 15,
    color: '#4A4545',
    fontWeight: '600' as const,
  },
});
