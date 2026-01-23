import { router } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import Colors from '@/constants/colors';

interface LotusFlowerProps {
  bloomAnim: Animated.Value;
  countdown: number;
}

const LotusFlower: React.FC<LotusFlowerProps> = ({ bloomAnim, countdown }) => {
  const petalColors = [
    '#F8BBD9', '#F48FB1', '#F06292', '#EC407A',
    '#E91E63', '#D81B60', '#C2185B', '#AD1457',
  ];

  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  const bloomScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const petalSpread = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={lotusStyles.container}>
      <View style={lotusStyles.lotusWrapper}>
        {petalAngles.map((angle, index) => {
          const spreadDistance = petalSpread.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 45],
          });

          const petalRotation = petalSpread.interpolate({
            inputRange: [0, 1],
            outputRange: [`${angle + 30}deg`, `${angle}deg`],
          });

          const petalScale = petalSpread.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          });

          const translateX = Animated.multiply(
            spreadDistance,
            Math.sin((angle * Math.PI) / 180)
          );

          const translateY = Animated.multiply(
            spreadDistance,
            -Math.cos((angle * Math.PI) / 180)
          );

          return (
            <Animated.View
              key={index}
              style={[
                lotusStyles.petal,
                {
                  backgroundColor: petalColors[index],
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate: petalRotation },
                    { scale: petalScale },
                  ],
                },
              ]}
            />
          );
        })}

        <Animated.View
          style={[
            lotusStyles.centerOuter,
            { transform: [{ scale: bloomScale }] },
          ]}
        >
          <View style={lotusStyles.centerInner}>
            <View style={lotusStyles.seed} />
            <View style={[lotusStyles.seed, { left: 8 }]} />
            <View style={[lotusStyles.seed, { top: 8, left: 4 }]} />
          </View>
        </Animated.View>
      </View>

      <View style={lotusStyles.countdownOverlay}>
        <Text style={lotusStyles.countdownText}>{countdown}</Text>
        <Text style={lotusStyles.countdownLabel}>seconds</Text>
      </View>
    </View>
  );
};

const lotusStyles = StyleSheet.create({
  container: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotusWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
    width: 30,
    height: 70,
    borderRadius: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  centerOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFEB3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seed: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF9800',
  },
  countdownOverlay: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  countdownLabel: {
    fontSize: 12,
    color: Colors.light.primary,
    opacity: 0.8,
  },
});

export default function PauseScreen() {
  const [phase, setPhase] = useState<'intro' | 'breathe' | 'reflect'>('intro');
  const [countdown, setCountdown] = useState(60);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  const bloomAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef(countdown);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  useEffect(() => {
    if (phase === 'breathe') {
      const runBreathCycle = () => {
        setBreathPhase('inhale');
        Animated.timing(bloomAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }).start(() => {
          setBreathPhase('exhale');
          Animated.timing(bloomAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }).start(() => {
            if (countdownRef.current > 0) {
              runBreathCycle();
            }
          });
        });
      };

      runBreathCycle();

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPhase('reflect');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        bloomAnim.stopAnimation();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pause Practice</Text>
          <View style={styles.backButton} />
        </View>

        {phase === 'intro' && (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Heart size={64} color={Colors.light.primary} fill={Colors.light.primary} />
            </View>
            <Text style={styles.title}>Take a Mindful Pause</Text>
            <Text style={styles.description}>
              Before reacting, let&apos;s take 60 seconds to breathe and reflect. This practice
              helps you respond with intention rather than impulse.
            </Text>

            <View style={styles.steps}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Follow the blooming lotus</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Reflect on your response</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Choose kindness</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setPhase('breathe')}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Start Practice</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'breathe' && (
          <View style={styles.content}>
            <Text style={styles.breatheTitle}>Breathe</Text>
            <Text style={styles.breatheSubtitle}>
              {breathPhase === 'inhale' ? 'Breathe in... watch it bloom' : 'Breathe out... let it rest'}
            </Text>

            <View style={styles.breatheContainer}>
              <LotusFlower bloomAnim={bloomAnim} countdown={countdown} />
            </View>

            <Text style={styles.breatheInstruction}>
              Focus on your breath. Let your thoughts settle.
            </Text>
          </View>
        )}

        {phase === 'reflect' && (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Heart size={64} color={Colors.light.primary} fill={Colors.light.primary} />
            </View>
            <Text style={styles.title}>Now Reflect</Text>
            <Text style={styles.description}>
              You&apos;ve taken a moment to pause. Now consider:
            </Text>

            <View style={styles.reflectionCard}>
              <Text style={styles.reflectionQuestion}>
                How do you want to respond instead?
              </Text>
              <Text style={styles.reflectionHint}>
                Think about how a calm, kind version of yourself would handle this
                situation.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Complete Practice</Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  steps: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    gap: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.card,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.card,
  },
  breatheTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  breatheSubtitle: {
    fontSize: 20,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  breatheContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80,
  },
  breatheInstruction: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  reflectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 28,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  reflectionQuestion: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
    lineHeight: 28,
  },
  reflectionHint: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.card,
  },
});
