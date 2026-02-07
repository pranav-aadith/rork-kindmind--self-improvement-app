import { router } from 'expo-router';
import { ArrowLeft, Play, Pause, RotateCcw, Minus, Plus, Moon, Check, Volume2, ChevronDown } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import Colors from '@/constants/colors';

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

export default function MeditationScreen() {
  const [phase, setPhase] = useState<'setup' | 'meditating' | 'complete'>('setup');
  const [selectedTime, setSelectedTime] = useState(300);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState(END_SOUNDS[0]);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const audioPlayer = useAudioPlayer(selectedSound.url ? { uri: selectedSound.url } : null);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    if (phase === 'setup') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [phase, fadeAnim]);

  useEffect(() => {
    if (phase === 'meditating' && isRunning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
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
  }, [phase, isRunning, pulseAnim, glowAnim]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (phase === 'meditating' && isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setPhase('complete');
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
  }, [phase, isRunning, timeRemaining, selectedTime, progressAnim, triggerHaptic, selectedSound.url, audioPlayer]);

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
    setPhase('meditating');
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
    setPhase('setup');
    progressAnim.setValue(0);
  };

  const progress = 1 - timeRemaining / selectedTime;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

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
          <Text style={styles.headerTitle}>Meditation Timer</Text>
          <View style={styles.backButton} />
        </View>

        {phase === 'setup' && (
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.moonContainer}>
              <View style={styles.moonGlow} />
              <View style={styles.moonIcon}>
                <Moon size={48} color={Colors.light.primary} fill={Colors.light.primary} />
              </View>
            </View>

            <Text style={styles.title}>Set Your Timer</Text>
            <Text style={styles.subtitle}>Choose how long you&apos;d like to meditate</Text>

            <View style={styles.timeDisplay}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustTime(-60)}
                activeOpacity={0.7}
              >
                <Minus size={24} color={Colors.light.primary} />
              </TouchableOpacity>

              <View style={styles.timeTextContainer}>
                <Text style={styles.timeText}>{formatTime(selectedTime)}</Text>
                <Text style={styles.timeLabel}>minutes</Text>
              </View>

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustTime(60)}
                activeOpacity={0.7}
              >
                <Plus size={24} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.presetsContainer}>
              <Text style={styles.presetsLabel}>Quick Select</Text>
              <View style={styles.presetsGrid}>
                {PRESET_TIMES.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.presetButton,
                      selectedTime === preset.value && styles.presetButtonActive,
                    ]}
                    onPress={() => selectPreset(preset.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedTime === preset.value && styles.presetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.soundPickerContainer}>
              <Text style={styles.presetsLabel}>End Sound</Text>
              <TouchableOpacity
                style={styles.soundSelector}
                onPress={() => setShowSoundPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.soundSelectorLeft}>
                  <Volume2 size={20} color={Colors.light.primary} />
                  <Text style={styles.soundSelectorText}>{selectedSound.label}</Text>
                </View>
                <ChevronDown size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
              {selectedSound.url && (
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={previewSound}
                  activeOpacity={0.7}
                >
                  <Play size={14} color={Colors.light.primary} />
                  <Text style={styles.previewButtonText}>Preview</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={startMeditation}
              activeOpacity={0.8}
            >
              <Play size={24} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.startButtonText}>Begin Meditation</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {phase === 'meditating' && (
          <View style={styles.meditatingContent}>
            <Text style={styles.meditatingTitle}>
              {isRunning ? 'Be Present' : 'Paused'}
            </Text>
            <Text style={styles.meditatingSubtitle}>
              {isRunning ? 'Focus on your breath' : 'Take your time'}
            </Text>

            <View style={styles.timerContainer}>
              <Animated.View
                style={[
                  styles.timerGlow,
                  { opacity: glowOpacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.timerCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        height: `${progress * 100}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.timerInner}>
                  <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                  <Text style={styles.timerLabel}>remaining</Text>
                </View>
              </Animated.View>
            </View>

            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={resetMeditation}
                activeOpacity={0.7}
              >
                <RotateCcw size={24} color={Colors.light.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.playPauseButton,
                  !isRunning && styles.playButton,
                ]}
                onPress={togglePause}
                activeOpacity={0.8}
              >
                {isRunning ? (
                  <Pause size={32} color="#FFF" />
                ) : (
                  <Play size={32} color="#FFF" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>

              <View style={styles.controlButton} />
            </View>
          </View>
        )}

        <Modal
          visible={showSoundPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSoundPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select End Sound</Text>
                <TouchableOpacity
                  onPress={() => setShowSoundPicker(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.soundList}>
                {END_SOUNDS.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundOption,
                      selectedSound.id === sound.id && styles.soundOptionActive,
                    ]}
                    onPress={() => selectSound(sound)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.soundOptionLeft}>
                      <Volume2
                        size={20}
                        color={selectedSound.id === sound.id ? Colors.light.primary : Colors.light.textSecondary}
                      />
                      <Text
                        style={[
                          styles.soundOptionText,
                          selectedSound.id === sound.id && styles.soundOptionTextActive,
                        ]}
                      >
                        {sound.label}
                      </Text>
                    </View>
                    {selectedSound.id === sound.id && (
                      <Check size={20} color={Colors.light.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {phase === 'complete' && (
          <View style={styles.completeContent}>
            <View style={styles.completeIconContainer}>
              <View style={styles.completeIconGlow} />
              <View style={styles.completeIcon}>
                <Check size={48} color="#FFF" />
              </View>
            </View>

            <Text style={styles.completeTitle}>Well Done</Text>
            <Text style={styles.completeSubtitle}>
              You completed {formatTime(selectedTime)} of meditation
            </Text>

            <View style={styles.completeCard}>
              <Text style={styles.completeCardTitle}>How do you feel?</Text>
              <Text style={styles.completeCardText}>
                Take a moment to notice any shifts in your mind and body. 
                Carry this calm with you.
              </Text>
            </View>

            <View style={styles.completeButtons}>
              <TouchableOpacity
                style={styles.anotherButton}
                onPress={resetMeditation}
                activeOpacity={0.8}
              >
                <RotateCcw size={20} color={Colors.light.primary} style={{ marginRight: 8 }} />
                <Text style={styles.anotherButtonText}>Meditate Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>
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
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  moonContainer: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  moonGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8DFF5',
    top: -20,
    left: -20,
  },
  moonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 24,
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeTextContainer: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    letterSpacing: -2,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: -4,
  },
  presetsContainer: {
    marginBottom: 24,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  presetButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  presetTextActive: {
    color: '#FFF',
  },
  soundPickerContainer: {
    marginBottom: 32,
  },
  soundSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  soundSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundSelectorText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  soundList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  soundOptionActive: {
    backgroundColor: '#F5F0FA',
  },
  soundOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundOptionText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  soundOptionTextActive: {
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  meditatingContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meditatingTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  meditatingSubtitle: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  timerGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E8DFF5',
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 120,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5F0FA',
  },
  timerInner: {
    alignItems: 'center',
    zIndex: 1,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    letterSpacing: -1,
  },
  timerLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  playButton: {
    backgroundColor: Colors.light.secondary,
  },
  completeContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeIconContainer: {
    marginBottom: 32,
  },
  completeIconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#D5EBE0',
    top: -20,
    left: -20,
  },
  completeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  completeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  completeCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  completeCardText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  completeButtons: {
    width: '100%',
    gap: 12,
  },
  anotherButton: {
    backgroundColor: '#F0E8F5',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  doneButton: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});
