import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';

const emotionOptions = [
  { emoji: '😊', label: 'Happy', color: '#FFD93D' },
  { emoji: '😌', label: 'Calm', color: '#6BCB77' },
  { emoji: '🥰', label: 'Loved', color: '#FF6B9D' },
  { emoji: '😔', label: 'Sad', color: '#748CAB' },
  { emoji: '😤', label: 'Frustrated', color: '#FF6B6B' },
  { emoji: '😰', label: 'Anxious', color: '#9B59B6' },
  { emoji: '😴', label: 'Tired', color: '#95A5A6' },
  { emoji: '🤔', label: 'Thoughtful', color: '#3498DB' },
  { emoji: '😇', label: 'Grateful', color: '#1ABC9C' },
  { emoji: '💪', label: 'Strong', color: '#E67E22' },
  { emoji: '😢', label: 'Hurt', color: '#5DADE2' },
  { emoji: '🌟', label: 'Hopeful', color: '#F39C12' },
];

export default function JournalScreen() {
  const { addJournalEntry } = useKindMind();
  const [step, setStep] = useState(1);
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<{ emoji: string; label: string } | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const emotionAnims = useRef(emotionOptions.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(iconBounce, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: step,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  useEffect(() => {
    if (step === 3) {
      emotionAnims.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 50),
          Animated.spring(anim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [step]);

  const animateStepChange = (nextStep: number) => {
    const isForward = nextStep > step;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isForward ? -30 : 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(isForward ? 30 : -30);
      iconBounce.setValue(0);
      if (nextStep === 3) {
        emotionAnims.forEach(anim => anim.setValue(0));
      }
      setStep(nextStep);
      
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 16);
    });
  };

  const animateButtonPress = () => {
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
    ]).start();
  };

  useFocusEffect(
    useCallback(() => {
      setStep(1);
      setGratitude('');
      setReflection('');
      setSelectedEmotion(null);
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      iconBounce.setValue(0);
      emotionAnims.forEach(anim => anim.setValue(0));
      Animated.spring(iconBounce, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const handleSubmit = () => {
    if (selectedEmotion) {
      addJournalEntry({
        gratitude,
        reflection,
        emotion: selectedEmotion.label,
        emotionEmoji: selectedEmotion.emoji,
      });
      router.replace('/');
    }
  };

  const canContinue = () => {
    if (step === 1) return gratitude.trim().length > 0;
    if (step === 2) return reflection.trim().length > 0;
    if (step === 3) return selectedEmotion !== null;
    return true;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Gratitude';
      case 2:
        return 'Reflection';
      case 3:
        return 'Feelings';
      default:
        return 'Journal';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (step === 1 ? router.back() : animateStepChange(step - 1))}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.progressBar}>
          {[1, 2, 3].map(s => (
            <Animated.View
              key={s}
              style={[
                styles.progressSegment,
                s <= step && styles.progressSegmentActive,
                s === step && { transform: [{ scaleX: 1 }] }
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconBounce }] }]}>
                <Text style={styles.stepIcon}>🌸</Text>
              </Animated.View>
              <Text style={styles.stepTitle}>What are you grateful for today?</Text>
              <Text style={styles.stepSubtitle}>
                Take a moment to appreciate the little things
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                placeholder="I'm grateful for..."
                placeholderTextColor={Colors.light.textSecondary}
                value={gratitude}
                onChangeText={setGratitude}
                autoFocus
              />
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconBounce }] }]}>
                <Text style={styles.stepIcon}>✨</Text>
              </Animated.View>
              <Text style={styles.stepTitle}>How was your day?</Text>
              <Text style={styles.stepSubtitle}>
                Share your thoughts, experiences, or anything on your mind
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                placeholder="Today was..."
                placeholderTextColor={Colors.light.textSecondary}
                value={reflection}
                onChangeText={setReflection}
                autoFocus
              />
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconBounce }] }]}>
                <Text style={styles.stepIcon}>💫</Text>
              </Animated.View>
              <Text style={styles.stepTitle}>How are you feeling?</Text>
              <Text style={styles.stepSubtitle}>
                Select the emotion that best describes you right now
              </Text>
              <View style={styles.emotionsGrid}>
                {emotionOptions.map((emotion, index) => (
                  <Animated.View
                    key={emotion.label}
                    style={[
                      styles.emotionCardWrapper,
                      {
                        opacity: emotionAnims[index],
                        transform: [{ scale: emotionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.emotionCard,
                        selectedEmotion?.label === emotion.label && {
                          ...styles.emotionCardSelected,
                          borderColor: emotion.color,
                          backgroundColor: `${emotion.color}15`,
                        },
                      ]}
                      onPress={() => setSelectedEmotion(emotion)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                      <Text
                        style={[
                          styles.emotionLabel,
                          selectedEmotion?.label === emotion.label && {
                            color: emotion.color,
                            fontWeight: '700' as const,
                          },
                        ]}
                      >
                        {emotion.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              {selectedEmotion && (
                <Animated.View style={[styles.selectedPreview, { opacity: fadeAnim }]}>
                  <Text style={styles.selectedPreviewText}>
                    You're feeling {selectedEmotion.emoji} {selectedEmotion.label}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
            <TouchableOpacity
              style={[styles.continueButton, !canContinue() && styles.continueButtonDisabled]}
              onPress={() => {
                animateButtonPress();
                if (step === 3) {
                  handleSubmit();
                } else {
                  animateStepChange(step + 1);
                }
              }}
              disabled={!canContinue()}
              activeOpacity={0.8}
            >
            <Text style={styles.continueButtonText}>
                {step === 3 ? 'Save Entry' : 'Continue'}
              </Text>
              {step < 3 ? (
                <ArrowRight size={20} color={Colors.light.card} />
              ) : (
                <Check size={20} color={Colors.light.card} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
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
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: Colors.light.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIcon: {
    fontSize: 48,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 28,
    lineHeight: 24,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 180,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  emotionCardWrapper: {
    width: 100,
  },
  emotionCard: {
    width: '100%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  emotionCardSelected: {
    borderWidth: 2,
  },
  emotionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emotionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  selectedPreview: {
    marginTop: 24,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedPreviewText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.light.border,
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.card,
  },
});
