import { Play, Pause, RotateCcw, Minus, Plus, X, Check, Volume2, ChevronDown } from 'lucide-react-native';
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

interface MeditationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MeditationModal({ visible, onClose }: MeditationModalProps) {
  const [phase, setPhase] = useState<'setup' | 'meditating' | 'complete'>('setup');
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
    if (phase === 'meditating' && isRunning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 4000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        ])
      );
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
        ])
      );
      pulseAnimation.start();
      glowAnimation.start();
      return () => { pulseAnimation.stop(); glowAnimation.stop(); };
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
        Animated.timing(progressAnim, { toValue: progress, duration: 200, useNativeDriver: false }).start();
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

  const handleClose = () => {
    setIsRunning(false);
    setPhase('setup');
    setTimeRemaining(selectedTime);
    progressAnim.setValue(0);
    onClose();
  };

  const progress = 1 - timeRemaining / selectedTime;
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
              <X size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Meditation</Text>
            <View style={styles.modalCloseBtn} />
          </View>

          {phase === 'setup' && (
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
              <View style={styles.timeDisplay}>
                <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(-60)} activeOpacity={0.7}>
                  <Minus size={22} color={Colors.light.text} />
                </TouchableOpacity>
                <View style={styles.timeTextContainer}>
                  <Text style={styles.timeText}>{formatTime(selectedTime)}</Text>
                  <Text style={styles.timeLabelText}>minutes</Text>
                </View>
                <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(60)} activeOpacity={0.7}>
                  <Plus size={22} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.presetsContainer}>
                <View style={styles.presetsGrid}>
                  {PRESET_TIMES.map((preset) => (
                    <TouchableOpacity
                      key={preset.value}
                      style={[styles.presetButton, selectedTime === preset.value && styles.presetButtonActive]}
                      onPress={() => selectPreset(preset.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetText, selectedTime === preset.value && styles.presetTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.soundPickerContainer}>
                <Text style={styles.fieldLabel}>End Sound</Text>
                <TouchableOpacity style={styles.soundSelector} onPress={() => setShowSoundPicker(true)} activeOpacity={0.7}>
                  <View style={styles.soundSelectorLeft}>
                    <Volume2 size={18} color={Colors.light.secondary} />
                    <Text style={styles.soundSelectorText}>{selectedSound.label}</Text>
                  </View>
                  <ChevronDown size={18} color={Colors.light.textSecondary} />
                </TouchableOpacity>
                {selectedSound.url ? (
                  <TouchableOpacity style={styles.previewButton} onPress={previewSound} activeOpacity={0.7}>
                    <Play size={12} color={Colors.light.secondary} />
                    <Text style={styles.previewButtonText}>Preview</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity style={styles.startButton} onPress={startMeditation} activeOpacity={0.8}>
                <Play size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>Begin</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {phase === 'meditating' && (
            <View style={styles.meditatingContent}>
              <Text style={styles.meditatingTitle}>{isRunning ? 'Be Present' : 'Paused'}</Text>
              <Text style={styles.meditatingSubtitle}>{isRunning ? 'Focus on your breath' : 'Take your time'}</Text>
              <View style={styles.timerContainer}>
                <Animated.View style={[styles.timerGlow, { opacity: glowOpacity }]} />
                <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.progressBackground}>
                    <View style={[styles.progressFillCircle, { height: `${progress * 100}%` }]} />
                  </View>
                  <View style={styles.timerInner}>
                    <Text style={styles.timerDisplayText}>{formatTime(timeRemaining)}</Text>
                    <Text style={styles.timerLabelText}>remaining</Text>
                  </View>
                </Animated.View>
              </View>
              <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.controlButton} onPress={resetMeditation} activeOpacity={0.7}>
                  <RotateCcw size={22} color={Colors.light.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.playPauseButton, !isRunning && styles.playButton]} onPress={togglePause} activeOpacity={0.8}>
                  {isRunning ? <Pause size={28} color="#FFF" /> : <Play size={28} color="#FFF" style={{ marginLeft: 3 }} />}
                </TouchableOpacity>
                <View style={styles.controlButton} />
              </View>
            </View>
          )}

          {phase === 'complete' && (
            <View style={styles.completeContent}>
              <View style={styles.completeIconContainer}>
                <View style={styles.completeIcon}>
                  <Check size={40} color="#FFF" />
                </View>
              </View>
              <Text style={styles.completeTitle}>Well Done</Text>
              <Text style={styles.completeSubtitle}>You completed {formatTime(selectedTime)} of meditation</Text>
              <View style={styles.completeCard}>
                <Text style={styles.completeCardTitle}>How do you feel?</Text>
                <Text style={styles.completeCardText}>Take a moment to notice any shifts in your mind and body.</Text>
              </View>
              <View style={styles.completeButtons}>
                <TouchableOpacity style={styles.anotherButton} onPress={resetMeditation} activeOpacity={0.8}>
                  <RotateCcw size={18} color={Colors.light.text} style={{ marginRight: 8 }} />
                  <Text style={styles.anotherButtonText}>Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneButton} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={styles.doneButtonText}>Done</Text>
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
              <TouchableOpacity onPress={() => setShowSoundPicker(false)} style={styles.soundModalCloseButton}>
                <Text style={styles.soundModalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.soundList}>
              {END_SOUNDS.map((sound) => (
                <TouchableOpacity
                  key={sound.id}
                  style={[styles.soundOption, selectedSound.id === sound.id && styles.soundOptionActive]}
                  onPress={() => selectSound(sound)}
                  activeOpacity={0.7}
                >
                  <View style={styles.soundOptionLeft}>
                    <Volume2 size={18} color={selectedSound.id === sound.id ? Colors.light.secondary : Colors.light.textSecondary} />
                    <Text style={[styles.soundOptionText, selectedSound.id === sound.id && styles.soundOptionTextActive]}>{sound.label}</Text>
                  </View>
                  {selectedSound.id === sound.id && <Check size={18} color={Colors.light.secondary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafeArea: { flex: 1, backgroundColor: Colors.light.background },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.light.border },
  modalCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.light.text, letterSpacing: -0.2 },
  modalContent: { flex: 1 },
  modalContentContainer: { padding: 24, paddingTop: 36 },
  timeDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 28 },
  adjustButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light.subtle, justifyContent: 'center', alignItems: 'center' },
  timeTextContainer: { alignItems: 'center' },
  timeText: { fontSize: 52, fontWeight: '200' as const, color: Colors.light.text, letterSpacing: -2 },
  timeLabelText: { fontSize: 13, color: Colors.light.textSecondary, marginTop: -2 },
  presetsContainer: { marginBottom: 28 },
  fieldLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.textSecondary, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  presetButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.light.subtle },
  presetButtonActive: { backgroundColor: Colors.light.primary },
  presetText: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.text },
  presetTextActive: { color: '#FFF' },
  soundPickerContainer: { marginBottom: 32 },
  soundSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.light.subtle, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  soundSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  soundSelectorText: { fontSize: 15, fontWeight: '500' as const, color: Colors.light.text },
  previewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, paddingVertical: 6 },
  previewButtonText: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.secondary },
  startButton: { backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  startButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#FFF' },
  meditatingContent: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  meditatingTitle: { fontSize: 28, fontWeight: '300' as const, color: Colors.light.text, textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 },
  meditatingSubtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', marginBottom: 48 },
  timerContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 56 },
  timerGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: Colors.light.subtle },
  timerCircle: { width: 220, height: 220, borderRadius: 110, backgroundColor: Colors.light.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  progressBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, borderRadius: 110, overflow: 'hidden' },
  progressFillCircle: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.light.subtle },
  timerInner: { alignItems: 'center', zIndex: 1 },
  timerDisplayText: { fontSize: 44, fontWeight: '200' as const, color: Colors.light.text, letterSpacing: -1 },
  timerLabelText: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.light.subtle, justifyContent: 'center', alignItems: 'center' },
  playPauseButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  playButton: { backgroundColor: Colors.light.secondary },
  completeContent: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  completeIconContainer: { marginBottom: 28 },
  completeIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.secondary, justifyContent: 'center', alignItems: 'center' },
  completeTitle: { fontSize: 28, fontWeight: '300' as const, color: Colors.light.text, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  completeSubtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', marginBottom: 32 },
  completeCard: { backgroundColor: Colors.light.subtle, borderRadius: 16, padding: 20, marginBottom: 36, width: '100%' },
  completeCardTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 6 },
  completeCardText: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 22 },
  completeButtons: { width: '100%', flexDirection: 'row', gap: 12 },
  anotherButton: { flex: 1, backgroundColor: Colors.light.subtle, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  anotherButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.text },
  doneButton: { flex: 1, backgroundColor: Colors.light.secondary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  doneButtonText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  soundModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  soundModalContent: { backgroundColor: Colors.light.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '55%' },
  soundModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.light.border },
  soundModalTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.light.text },
  soundModalCloseButton: { paddingHorizontal: 12, paddingVertical: 6 },
  soundModalCloseText: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.secondary },
  soundList: { paddingHorizontal: 16, paddingTop: 8 },
  soundOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, marginVertical: 2 },
  soundOptionActive: { backgroundColor: Colors.light.subtle },
  soundOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  soundOptionText: { fontSize: 15, fontWeight: '500' as const, color: Colors.light.text },
  soundOptionTextActive: { color: Colors.light.secondary, fontWeight: '600' as const },
});
