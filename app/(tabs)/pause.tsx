import { router } from 'expo-router';
import { ArrowLeft, RotateCcw, Check, Wind } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.65;

type Duration = 30 | 60 | 120;
type Phase = 'ready' | 'breathing' | 'complete';

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
];

export default function PauseScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('ready');
  const [selectedDuration, setSelectedDuration] = useState<Duration>(60);
  const [countdown, setCountdown] = useState(60);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const countdownRef = useRef(countdown);
  const breathAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const startPractice = useCallback(() => {
    setCountdown(selectedDuration);
    countdownRef.current = selectedDuration;
    setPhase('breathing');
    triggerHaptic();
  }, [selectedDuration, triggerHaptic]);

  const resetPractice = useCallback(() => {
    breathAnimRef.current?.stop();
    breatheAnim.setValue(0);
    setPhase('ready');
    setCountdown(selectedDuration);
    setBreathPhase('inhale');
    triggerHaptic();
  }, [selectedDuration, breatheAnim, triggerHaptic]);

  const completePractice = useCallback(() => {
    setSessionsCompleted(prev => prev + 1);
    triggerHaptic();
  }, [triggerHaptic]);

  const startNewSession = useCallback(() => {
    setPhase('ready');
    setCountdown(selectedDuration);
    setBreathPhase('inhale');
    breatheAnim.setValue(0);
    triggerHaptic();
  }, [selectedDuration, breatheAnim, triggerHaptic]);

  useEffect(() => {
    if (phase === 'breathing') {
      const runBreathCycle = () => {
        if (countdownRef.current <= 0) return;
        
        setBreathPhase('inhale');
        
        const inhaleAnim = Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        });

        const holdAnim = Animated.delay(1000);

        const exhaleAnim = Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        });

        breathAnimRef.current = Animated.sequence([
          inhaleAnim,
          Animated.delay(100),
          exhaleAnim,
        ]);

        breathAnimRef.current.start(() => {
          if (countdownRef.current > 0) {
            runBreathCycle();
          }
        });

        setTimeout(() => setBreathPhase('hold'), 4000);
        setTimeout(() => setBreathPhase('exhale'), 5000);
      };

      runBreathCycle();

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPhase('complete');
            completePractice();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        breathAnimRef.current?.stop();
      };
    }
  }, [phase, breatheAnim, completePractice]);

  useEffect(() => {
    if (phase === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase, pulseAnim]);

  const breathScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const breathOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 1],
  });

  const innerRingScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}`;
  };

  const getBreathText = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="back-button"
        >
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        {sessionsCompleted > 0 && (
          <View style={styles.sessionsBadge}>
            <Text style={styles.sessionsText}>{sessionsCompleted} done</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {phase === 'ready' && (
          <>
            <View style={styles.titleSection}>
              <Wind size={32} color={Colors.light.secondary} />
              <Text style={styles.title}>Pause & Breathe</Text>
              <Text style={styles.subtitle}>Choose your duration</Text>
            </View>

            <View style={styles.durationSelector}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    styles.durationOption,
                    selectedDuration === d.value && styles.durationOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedDuration(d.value);
                    setCountdown(d.value);
                    triggerHaptic();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.durationText,
                      selectedDuration === d.value && styles.durationTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.startArea}
              onPress={startPractice}
              activeOpacity={0.9}
              testID="start-button"
            >
              <Animated.View
                style={[
                  styles.startCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.startCircleInner}>
                  <Text style={styles.startText}>Start</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>

            <Text style={styles.hint}>Tap to begin your mindful pause</Text>
          </>
        )}

        {phase === 'breathing' && (
          <>
            <Text style={styles.breathTitle}>{getBreathText()}</Text>
            
            <View style={styles.circleContainer}>
              <Animated.View
                style={[
                  styles.outerRing,
                  {
                    transform: [{ scale: breathScale }],
                    opacity: breathOpacity,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.innerRing,
                  {
                    transform: [{ scale: innerRingScale }],
                  },
                ]}
              />
              <View style={styles.centerCircle}>
                <Text style={styles.countdownNumber}>{formatTime(countdown)}</Text>
                <Text style={styles.countdownLabel}>remaining</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={resetPractice}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>End Early</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'complete' && (
          <>
            <View style={styles.completeIcon}>
              <Check size={48} color={Colors.light.card} />
            </View>
            
            <Text style={styles.completeTitle}>Well Done</Text>
            <Text style={styles.completeSubtitle}>
              You took a moment to pause and breathe.{'\n'}
              How do you feel now?
            </Text>

            <View style={styles.completeActions}>
              <TouchableOpacity
                style={styles.repeatButton}
                onPress={startNewSession}
                activeOpacity={0.8}
                testID="repeat-button"
              >
                <RotateCcw size={20} color={Colors.light.card} />
                <Text style={styles.repeatButtonText}>Practice Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>I&apos;m Done</Text>
              </TouchableOpacity>
            </View>

            {sessionsCompleted > 1 && (
              <Text style={styles.totalSessions}>
                {sessionsCompleted} sessions completed today 🎉
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionsBadge: {
    backgroundColor: Colors.light.tertiary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sessionsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  durationSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 6,
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  durationOption: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  durationOptionActive: {
    backgroundColor: Colors.light.secondary,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  durationTextActive: {
    color: Colors.light.card,
  },
  startArea: {
    marginBottom: 32,
  },
  startCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: Colors.light.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startCircleInner: {
    width: CIRCLE_SIZE * 0.7,
    height: CIRCLE_SIZE * 0.7,
    borderRadius: (CIRCLE_SIZE * 0.7) / 2,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  startText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.card,
    letterSpacing: 1,
  },
  hint: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  breathTitle: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 40,
    letterSpacing: -0.5,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: Colors.light.secondary + '30',
  },
  innerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE * 0.85,
    height: CIRCLE_SIZE * 0.85,
    borderRadius: (CIRCLE_SIZE * 0.85) / 2,
    backgroundColor: Colors.light.secondary + '50',
  },
  centerCircle: {
    width: CIRCLE_SIZE * 0.5,
    height: CIRCLE_SIZE * 0.5,
    borderRadius: (CIRCLE_SIZE * 0.5) / 2,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  countdownLabel: {
    fontSize: 13,
    color: Colors.light.card,
    opacity: 0.85,
    marginTop: 2,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  completeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  completeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  completeSubtitle: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  completeActions: {
    width: '100%',
    gap: 14,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.light.secondary,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  repeatButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  doneButton: {
    backgroundColor: Colors.light.card,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  totalSessions: {
    marginTop: 28,
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
});
