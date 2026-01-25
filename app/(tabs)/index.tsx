import { router } from 'expo-router';
import { Heart, BookOpen, Flower, CheckCircle2, BarChart3, Sparkles, Timer, Play, Pause, RotateCcw, Minus, Plus, X, Check, Volume2, ChevronDown, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import { getDailyQuote } from '@/constants/quotes';

const PRESET_TIMES = [
  { label: '1 min', value: 60 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
  { label: '20 min', value: 1200 },
];

const END_SOUNDS = [
  { id: 'bell', label: 'Tibetan Bell', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'chime', label: 'Wind Chime', url: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3' },
  { id: 'none', label: 'No Sound', url: '' },
];

export default function HomeScreen() {
  const { data, hasCheckedInToday } = useKindMind();
  const dailyQuote = getDailyQuote();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [meditationPhase, setMeditationPhase] = useState<'setup' | 'meditating' | 'complete'>('setup');
  const [selectedTime, setSelectedTime] = useState(300);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState(END_SOUNDS[0]);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const audioPlayer = useAudioPlayer(selectedSound.url ? { uri: selectedSound.url } : null);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (meditationPhase === 'meditating' && isRunning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      );

      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    }
  }, [meditationPhase, isRunning, pulseAnim, glowAnim]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (meditationPhase === 'meditating' && isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setMeditationPhase('complete');
            triggerHaptic();
            if (selectedSound.url && audioPlayer) {
              audioPlayer.seekTo(0);
              audioPlayer.play();
            }
            return 0;
          }
          return prev - 1;
        });

        const progress = 1 - (timeRemaining - 1) / selectedTime;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [meditationPhase, isRunning, timeRemaining, selectedTime, progressAnim, triggerHaptic, selectedSound.url, audioPlayer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTime = (amount: number) => {
    triggerHaptic();
    const newTime = Math.max(60, Math.min(3600, selectedTime + amount));
    setSelectedTime(newTime);
    setTimeRemaining(newTime);
  };

  const selectPreset = (value: number) => {
    triggerHaptic();
    setSelectedTime(value);
    setTimeRemaining(value);
  };

  const selectSound = (sound: typeof END_SOUNDS[0]) => {
    triggerHaptic();
    setSelectedSound(sound);
    setShowSoundPicker(false);
  };

  const previewSound = () => {
    if (selectedSound.url && audioPlayer) {
      triggerHaptic();
      audioPlayer.seekTo(0);
      audioPlayer.play();
    }
  };

  const startMeditation = () => {
    triggerHaptic();
    setMeditationPhase('meditating');
    setIsRunning(true);
    progressAnim.setValue(0);
  };

  const togglePause = () => {
    triggerHaptic();
    setIsRunning(!isRunning);
  };

  const resetMeditation = () => {
    triggerHaptic();
    setIsRunning(false);
    setTimeRemaining(selectedTime);
    setMeditationPhase('setup');
    progressAnim.setValue(0);
  };

  const closeMeditationModal = () => {
    setShowMeditationModal(false);
    setIsRunning(false);
    setMeditationPhase('setup');
    setTimeRemaining(selectedTime);
    progressAnim.setValue(0);
  };

  const progress = 1 - timeRemaining / selectedTime;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>Hi, {data.username || 'there'} 👋</Text>
              <Text style={styles.subtitle}>How are you feeling today?</Text>
            </View>
            <View style={styles.streakBadge}>
              <Flower size={16} color={Colors.light.primary} />
              <Text style={styles.streakText}>{data.currentStreak}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.quoteCard, { opacity: fadeAnim }]}>
          <Sparkles size={16} color={Colors.light.cream} />
          <Text style={styles.quoteText}>{dailyQuote}</Text>
        </Animated.View>

        {!hasCheckedInToday && (
          <TouchableOpacity
            style={styles.checkInCard}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.7}
          >
            <View style={styles.checkInLeft}>
              <View style={styles.checkInIcon}>
                <CheckCircle2 size={20} color={Colors.light.card} />
              </View>
              <View>
                <Text style={styles.checkInTitle}>Daily Check-In</Text>
                <Text style={styles.checkInSubtitle}>Take a moment to reflect</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.light.card} />
          </TouchableOpacity>
        )}

        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors.light.primary }]}
              onPress={() => router.push('/trigger')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <BookOpen size={22} color={Colors.light.primary} />
              </View>
              <Text style={styles.actionLabel}>Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors.light.secondary }]}
              onPress={() => router.push('/pause')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <Heart size={22} color={Colors.light.secondary} />
              </View>
              <Text style={styles.actionLabel}>Breathe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors.light.accent }]}
              onPress={() => setShowMeditationModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <Timer size={22} color={Colors.light.accent} />
              </View>
              <Text style={styles.actionLabel}>Meditate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.progressCard}
          onPress={() => router.push('/progress')}
          activeOpacity={0.7}
        >
          <View style={styles.progressLeft}>
            <View style={styles.progressIcon}>
              <BarChart3 size={20} color={Colors.light.primary} />
            </View>
            <View>
              <Text style={styles.progressTitle}>View Progress</Text>
              <Text style={styles.progressSubtitle}>Track your emotional patterns</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>

        {data.goals.filter(g => g.selected).length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionLabel}>Your Goals</Text>
            <View style={styles.goalsCard}>
              {data.goals.filter(g => g.selected).map(goal => (
                <View key={goal.id} style={styles.goalRow}>
                  <View style={styles.goalDot} />
                  <Text style={styles.goalText}>{goal.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.journalEntries && data.journalEntries.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recent Entries</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={styles.seeAllLink}>See all</Text>
              </TouchableOpacity>
            </View>
            {data.journalEntries.slice(0, 2).map(entry => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryEmoji}>{entry.emotionEmoji}</Text>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryEmotion}>{entry.emotion}</Text>
                    <Text style={styles.entryDate}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                {entry.gratitude && (
                  <Text style={styles.entryPreview} numberOfLines={2}>{entry.gratitude}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showMeditationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeMeditationModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeMeditationModal} style={styles.modalCloseBtn}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Meditation</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            {meditationPhase === 'setup' && (
              <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                <View style={styles.timeDisplay}>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(-60)} activeOpacity={0.7}>
                    <Minus size={20} color={Colors.light.primary} />
                  </TouchableOpacity>
                  <View style={styles.timeCenter}>
                    <Text style={styles.timeValue}>{formatTime(selectedTime)}</Text>
                    <Text style={styles.timeUnit}>minutes</Text>
                  </View>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(60)} activeOpacity={0.7}>
                    <Plus size={20} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.presetsSection}>
                  <Text style={styles.presetsLabel}>Quick Select</Text>
                  <View style={styles.presetsRow}>
                    {PRESET_TIMES.map(preset => (
                      <TouchableOpacity
                        key={preset.value}
                        style={[styles.presetChip, selectedTime === preset.value && styles.presetChipActive]}
                        onPress={() => selectPreset(preset.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.presetChipText, selectedTime === preset.value && styles.presetChipTextActive]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.soundSection}>
                  <Text style={styles.presetsLabel}>End Sound</Text>
                  <TouchableOpacity style={styles.soundSelector} onPress={() => setShowSoundPicker(true)} activeOpacity={0.7}>
                    <View style={styles.soundLeft}>
                      <Volume2 size={18} color={Colors.light.primary} />
                      <Text style={styles.soundText}>{selectedSound.label}</Text>
                    </View>
                    <ChevronDown size={18} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                  {selectedSound.url && (
                    <TouchableOpacity style={styles.previewBtn} onPress={previewSound} activeOpacity={0.7}>
                      <Play size={12} color={Colors.light.primary} />
                      <Text style={styles.previewBtnText}>Preview</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity style={styles.startBtn} onPress={startMeditation} activeOpacity={0.8}>
                  <Play size={20} color="#FFF" />
                  <Text style={styles.startBtnText}>Begin</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {meditationPhase === 'meditating' && (
              <View style={styles.meditatingContent}>
                <Text style={styles.meditatingTitle}>{isRunning ? 'Be Present' : 'Paused'}</Text>
                <Text style={styles.meditatingSubtitle}>{isRunning ? 'Focus on your breath' : 'Take your time'}</Text>

                <View style={styles.timerContainer}>
                  <Animated.View style={[styles.timerGlow, { opacity: glowOpacity }]} />
                  <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { height: `${progress * 100}%` }]} />
                    </View>
                    <View style={styles.timerInner}>
                      <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                      <Text style={styles.timerLabel}>remaining</Text>
                    </View>
                  </Animated.View>
                </View>

                <View style={styles.controlsRow}>
                  <TouchableOpacity style={styles.controlBtn} onPress={resetMeditation} activeOpacity={0.7}>
                    <RotateCcw size={22} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.playPauseBtn, !isRunning && styles.playBtn]}
                    onPress={togglePause}
                    activeOpacity={0.8}
                  >
                    {isRunning ? <Pause size={28} color="#FFF" /> : <Play size={28} color="#FFF" style={{ marginLeft: 3 }} />}
                  </TouchableOpacity>
                  <View style={styles.controlBtn} />
                </View>
              </View>
            )}

            {meditationPhase === 'complete' && (
              <View style={styles.completeContent}>
                <View style={styles.completeIconWrap}>
                  <Check size={40} color="#FFF" />
                </View>
                <Text style={styles.completeTitle}>Well Done</Text>
                <Text style={styles.completeSubtitle}>You completed {formatTime(selectedTime)} of meditation</Text>

                <View style={styles.completeCard}>
                  <Text style={styles.completeCardTitle}>How do you feel?</Text>
                  <Text style={styles.completeCardText}>Notice any shifts in your mind and body.</Text>
                </View>

                <View style={styles.completeActions}>
                  <TouchableOpacity style={styles.againBtn} onPress={resetMeditation} activeOpacity={0.8}>
                    <RotateCcw size={18} color={Colors.light.primary} />
                    <Text style={styles.againBtnText}>Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doneBtn} onPress={closeMeditationModal} activeOpacity={0.8}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>

        <Modal visible={showSoundPicker} transparent animationType="slide" onRequestClose={() => setShowSoundPicker(false)}>
          <View style={styles.soundModalOverlay}>
            <View style={styles.soundModalContent}>
              <View style={styles.soundModalHeader}>
                <Text style={styles.soundModalTitle}>End Sound</Text>
                <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                  <Text style={styles.soundModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              {END_SOUNDS.map(sound => (
                <TouchableOpacity
                  key={sound.id}
                  style={[styles.soundOption, selectedSound.id === sound.id && styles.soundOptionActive]}
                  onPress={() => selectSound(sound)}
                  activeOpacity={0.7}
                >
                  <View style={styles.soundOptionLeft}>
                    <Volume2 size={18} color={selectedSound.id === sound.id ? Colors.light.primary : Colors.light.textSecondary} />
                    <Text style={[styles.soundOptionText, selectedSound.id === sound.id && styles.soundOptionTextActive]}>
                      {sound.label}
                    </Text>
                  </View>
                  {selectedSound.id === sound.id && <Check size={18} color={Colors.light.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.card,
    fontWeight: '500',
  },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkInIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },
  checkInSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  actionsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.card,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  progressSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  goalsSection: {
    marginBottom: 24,
  },
  goalsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  goalText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  entryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryEmoji: {
    fontSize: 28,
  },
  entryMeta: {
    flex: 1,
  },
  entryEmotion: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  entryDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  entryPreview: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 10,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 30,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 24,
    paddingTop: 32,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timeCenter: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.light.primary,
    letterSpacing: -2,
  },
  timeUnit: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: -4,
  },
  presetsSection: {
    marginBottom: 24,
  },
  presetsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  presetChipTextActive: {
    color: '#FFF',
  },
  soundSection: {
    marginBottom: 32,
  },
  soundSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  soundLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  soundText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingVertical: 6,
  },
  previewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  startBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  meditatingContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meditatingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  meditatingSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 40,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  timerGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.light.primary + '30',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  progressBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.primary + '15',
  },
  timerInner: {
    alignItems: 'center',
    zIndex: 1,
  },
  timerText: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.light.primary,
    letterSpacing: -1,
  },
  timerLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  playPauseBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    backgroundColor: Colors.light.secondary,
  },
  completeContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  completeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  completeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  completeCardText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  completeActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  againBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 14,
    paddingVertical: 14,
  },
  againBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  soundModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  soundModalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  soundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  soundModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  soundModalDone: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  soundOptionActive: {
    backgroundColor: Colors.light.primary + '10',
  },
  soundOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  soundOptionTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
