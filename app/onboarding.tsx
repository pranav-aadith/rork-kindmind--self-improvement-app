import { router } from 'expo-router';
import { Target, Brain, Sparkles, ChevronRight, ChevronLeft, User } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import type { UserGoal, OnboardingAnswers } from '@/types';

export default function OnboardingScreen() {
  const { data, completeOnboarding } = useKindMind();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [goals, setGoals] = useState<UserGoal[]>(data.goals);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    reactionSpeed: '',
    commonTriggers: [],
    relationshipImpact: '',
    awareness: '',
    frequency: '',
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / 7,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const animateStepChange = (nextStep: number, callback: () => void) => {
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
      callback();
      slideAnim.setValue(isForward ? 30 : -30);
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

  const toggleGoal = (id: string) => {
    setGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, selected: !g.selected } : g))
    );
  };

  const toggleTrigger = (trigger: string) => {
    setAnswers(prev => ({
      ...prev,
      commonTriggers: prev.commonTriggers.includes(trigger)
        ? prev.commonTriggers.filter(t => t !== trigger)
        : [...prev.commonTriggers, trigger],
    }));
  };

  const handleComplete = () => {
    completeOnboarding(username.trim(), goals, answers);
    router.replace('/(tabs)');
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return username.trim().length > 0;
      case 2:
        return goals.filter(g => g.selected).length > 0;
      case 3:
        return answers.reactionSpeed !== '';
      case 4:
        return answers.commonTriggers.length > 0;
      case 5:
        return answers.relationshipImpact !== '';
      case 6:
        return answers.awareness !== '';
      case 7:
        return answers.frequency !== '';
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <UsernameStep value={username} onChange={setUsername} />;
      case 2:
        return <GoalsStep goals={goals} toggleGoal={toggleGoal} />;
      case 3:
        return <ReactionSpeedStep value={answers.reactionSpeed} onChange={(v) => setAnswers(p => ({ ...p, reactionSpeed: v }))} />;
      case 4:
        return <TriggersStep selected={answers.commonTriggers} onToggle={toggleTrigger} />;
      case 5:
        return <RelationshipImpactStep value={answers.relationshipImpact} onChange={(v) => setAnswers(p => ({ ...p, relationshipImpact: v }))} />;
      case 6:
        return <AwarenessStep value={answers.awareness} onChange={(v) => setAnswers(p => ({ ...p, awareness: v }))} />;
      case 7:
        return <FrequencyStep value={answers.frequency} onChange={(v) => setAnswers(p => ({ ...p, frequency: v }))} />;
      default:
        return null;
    }
  };

  const isLastStep = step === 7;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
          <Text style={styles.progressText}>
            {step === 0 ? 'Welcome' : `${step} of 7`}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => animateStepChange(step - 1, () => setStep(s => s - 1))}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={Colors.light.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={{ flex: 1 }} />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.nextButton, !canContinue() && styles.nextButtonDisabled]}
              onPress={() => {
                animateButtonPress();
                if (isLastStep) {
                  handleComplete();
                } else {
                  animateStepChange(step + 1, () => setStep(s => s + 1));
                }
              }}
              disabled={!canContinue()}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {step === 0 ? "Let's Begin" : isLastStep ? 'Complete' : 'Continue'}
              </Text>
              {!isLastStep && <ChevronRight size={24} color={Colors.light.card} />}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.stepContainer}>
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
          This quick assessment will help us understand your patterns and personalize your experience.
        </Text>
      </View>
    </View>
  );
}

function GoalsStep({ goals, toggleGoal }: { goals: UserGoal[]; toggleGoal: (id: string) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What brings you here?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>

      <View style={styles.optionsContainer}>
        {goals.map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.optionCard, goal.selected && styles.optionCardSelected]}
            onPress={() => toggleGoal(goal.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <View style={[styles.checkbox, goal.selected && styles.checkboxSelected]}>
                {goal.selected && <View style={styles.checkboxInner} />}
              </View>
              <Text style={[styles.optionText, goal.selected && styles.optionTextSelected]}>
                {goal.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ReactionSpeedStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { id: 'instant', label: 'Instantly - I react before thinking', emoji: '⚡' },
    { id: 'quick', label: 'Quickly - Within seconds', emoji: '🏃' },
    { id: 'delayed', label: 'Delayed - After a few moments', emoji: '⏱️' },
    { id: 'thoughtful', label: 'Thoughtfully - I usually pause first', emoji: '🤔' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How fast do you typically react when upset?</Text>
      <Text style={styles.stepSubtitle}>Understanding your reaction speed helps personalize your practice</Text>

      <View style={styles.optionsContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, value === option.id && styles.optionCardSelected]}
            onPress={() => onChange(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[styles.optionText, value === option.id && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TriggersStep({ selected, onToggle }: { selected: string[]; onToggle: (t: string) => void }) {
  const triggers = [
    { id: 'criticism', label: 'Being criticized or judged', emoji: '😤' },
    { id: 'ignored', label: 'Feeling ignored or dismissed', emoji: '😔' },
    { id: 'interruption', label: 'Being interrupted', emoji: '🙄' },
    { id: 'unfairness', label: 'Perceived unfairness', emoji: '😠' },
    { id: 'stress', label: 'High stress or pressure', emoji: '😰' },
    { id: 'misunderstood', label: 'Being misunderstood', emoji: '😣' },
    { id: 'disrespect', label: 'Feeling disrespected', emoji: '😡' },
    { id: 'control', label: 'Loss of control', emoji: '😩' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What situations typically trigger you?</Text>
      <Text style={styles.stepSubtitle}>Select all that resonate with you</Text>

      <View style={styles.optionsContainer}>
        {triggers.map(trigger => (
          <TouchableOpacity
            key={trigger.id}
            style={[
              styles.optionCard,
              selected.includes(trigger.id) && styles.optionCardSelected
            ]}
            onPress={() => onToggle(trigger.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.emoji}>{trigger.emoji}</Text>
              <Text style={[
                styles.optionText,
                selected.includes(trigger.id) && styles.optionTextSelected
              ]}>
                {trigger.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function RelationshipImpactStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { id: 'significant', label: 'Significantly - It affects my relationships often', emoji: '💔' },
    { id: 'moderate', label: 'Moderately - Sometimes causes issues', emoji: '😕' },
    { id: 'occasional', label: 'Occasionally - Rare but happens', emoji: '😌' },
    { id: 'minimal', label: 'Minimally - Rarely affects relationships', emoji: '😊' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How do your reactions affect your relationships?</Text>
      <Text style={styles.stepSubtitle}>Be honest - this helps us support you better</Text>

      <View style={styles.optionsContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, value === option.id && styles.optionCardSelected]}
            onPress={() => onChange(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[styles.optionText, value === option.id && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AwarenessStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { id: 'after', label: 'Only afterward - I notice when it is too late', emoji: '😓' },
    { id: 'during', label: 'During - While I am reacting', emoji: '😬' },
    { id: 'before', label: 'Before - I can feel it building', emoji: '🧘' },
    { id: 'rarely', label: 'Rarely - I usually do not notice', emoji: '😶' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When do you notice your emotional reactions?</Text>
      <Text style={styles.stepSubtitle}>Awareness is the first step to change</Text>

      <View style={styles.optionsContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, value === option.id && styles.optionCardSelected]}
            onPress={() => onChange(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[styles.optionText, value === option.id && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function UsernameStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <User size={48} color={Colors.light.primary} />
      </View>
      <Text style={styles.stepTitle}>What should we call you?</Text>
      <Text style={styles.stepSubtitle}>Enter a username to personalize your experience</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Your username"
        placeholderTextColor={Colors.light.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
      />
    </View>
  );
}

function FrequencyStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { id: 'multiple-daily', label: 'Multiple times per day', emoji: '🔥' },
    { id: 'daily', label: 'About once per day', emoji: '📅' },
    { id: 'few-weekly', label: 'A few times per week', emoji: '📊' },
    { id: 'weekly', label: 'About once per week', emoji: '🗓️' },
    { id: 'rarely', label: 'Rarely or occasionally', emoji: '✨' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How often do you have reactions you later regret?</Text>
      <Text style={styles.stepSubtitle}>This helps us track your progress over time</Text>

      <View style={styles.optionsContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, value === option.id && styles.optionCardSelected]}
            onPress={() => onChange(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[styles.optionText, value === option.id && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  stepContainer: {
    gap: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
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
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 36,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  features: {
    marginTop: 32,
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  featureDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    backgroundColor: '#FFF0ED',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
    marginTop: 8,
  },
  optionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#FFF0ED',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.card,
  },
  emoji: {
    fontSize: 32,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    color: Colors.light.text,
    fontWeight: '500',
    lineHeight: 24,
  },
  optionTextSelected: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 32,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  nextButtonDisabled: {
    backgroundColor: Colors.light.border,
    shadowOpacity: 0,
  },
  nextButtonText: {
    color: Colors.light.card,
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginTop: 8,
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
});
