import { router } from 'expo-router';
import { Heart, BookOpen, Flower, CheckCircle2, BarChart3, Sparkles, Timer, Play, Pause, RotateCcw, Minus, Plus, X, Check, Volume2, ChevronDown, Mic, MicOff, Keyboard, Send, Smile } from 'lucide-react-native';
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
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { Audio } from 'expo-av';
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

const EMOTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🥰', label: 'Grateful' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤔', label: 'Reflective' },
];

export default function HomeScreen() {
  const { data, hasCheckedInToday, addJournalEntry } = useKindMind();
  const dailyQuote = getDailyQuote();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;

  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [meditationPhase, setMeditationPhase] = useState<'setup' | 'meditating' | 'complete'>('setup');
  const [selectedTime, setSelectedTime] = useState(300);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState(END_SOUNDS[0]);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<typeof EMOTIONS[0] | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingPulse = useRef(new Animated.Value(1)).current;

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
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.timing(quoteAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(150, [
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(card1Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card3Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  useEffect(() => {
    if (meditationPhase === 'meditating' && isRunning) {
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

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.log('Permission not granted');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      setRecording(newRecording);
      setIsRecording(true);
      triggerHaptic();

      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    recordingPulse.stopAnimation();
    recordingPulse.setValue(1);
    triggerHaptic();

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecording(null);
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const audioFile = {
        uri,
        name: 'recording.' + fileType,
        type: 'audio/' + fileType,
      } as unknown as Blob;

      formData.append('audio', audioFile);

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription result:', data);

      if (data.text) {
        setJournalText(prev => prev ? prev + ' ' + data.text : data.text);
      }
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const saveJournalEntry = () => {
    if (!journalText.trim() || !selectedEmotion) return;

    triggerHaptic();
    addJournalEntry({
      gratitude: journalText.trim(),
      reflection: '',
      emotion: selectedEmotion.label,
      emotionEmoji: selectedEmotion.emoji,
    });

    setJournalText('');
    setSelectedEmotion(null);
    setShowJournalModal(false);
  };

  const closeJournalModal = () => {
    if (isRecording && recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
    }
    setShowJournalModal(false);
    setJournalText('');
    setSelectedEmotion(null);
    setInputMode('voice');
  };

  const progress = 1 - timeRemaining / selectedTime;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const animateButtonPress = (callback: () => void) => {
    callback();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Animated.View style={[styles.headerTop, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={styles.greeting}>Hello {data.username || 'there'}</Text>
              <Text style={styles.subtitle}>How are you feeling today?</Text>
            </View>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: heartScale }] }]}>
              <Heart size={32} color={Colors.light.primary} fill={Colors.light.primary} />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.quoteCard, { opacity: quoteAnim, transform: [{ scale: quoteAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
          <View style={styles.quoteIconContainer}>
            <Sparkles size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.quoteText}>{dailyQuote}</Text>
        </Animated.View>

        {!hasCheckedInToday && (
          <TouchableOpacity
            style={styles.checkInBanner}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.8}
          >
            <View style={styles.bannerIcon}>
              <CheckCircle2 size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Daily Check-In</Text>
              <Text style={styles.bannerText}>Reflect on today</Text>
            </View>
            <View style={styles.bannerArrow}>
              <Text style={styles.bannerArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        <Animated.View style={[styles.statsGrid, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Flower size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.statNumber}>{data.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          <Animated.View style={{ opacity: card1Anim, transform: [{ scale: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardPrimary]}
              onPress={() => setShowJournalModal(true)}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIcon, styles.actionIconPrimary]}>
                <BookOpen size={28} color={Colors.light.card} />
              </View>
              <Text style={styles.actionTitle}>Journal</Text>
              <Text style={styles.actionDescription}>
                Reflect on your day and emotions
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: card2Anim, transform: [{ scale: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardSecondary]}
              onPress={() => animateButtonPress(() => router.push('/pause'))}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIcon, styles.actionIconSecondary]}>
                <Heart size={28} color={Colors.light.card} />
              </View>
              <Text style={styles.actionTitle}>Pause Practice</Text>
              <Text style={styles.actionDescription}>
                Take a mindful moment to breathe
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: card3Anim, transform: [{ scale: card3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardMeditation]}
              onPress={() => setShowMeditationModal(true)}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIcon, styles.actionIconMeditation]}>
                <Timer size={28} color={Colors.light.card} />
              </View>
              <Text style={styles.actionTitle}>Meditation Timer</Text>
              <Text style={styles.actionDescription}>
                Set a timer for mindful meditation
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {data.goals.filter(g => g.selected).length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Goals</Text>
            </View>

            <View style={styles.goalsContainer}>
              {data.goals
                .filter(g => g.selected)
                .map(goal => (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={styles.goalDot} />
                    <Text style={styles.goalText}>{goal.label}</Text>
                  </View>
                ))}
            </View>
          </>
        )}



        <TouchableOpacity
          style={styles.analyticsCard}
          onPress={() => router.push('/progress')}
          activeOpacity={0.8}
        >
          <View style={styles.analyticsIcon}>
            <BarChart3 size={24} color={Colors.light.primary} />
          </View>
          <View style={styles.analyticsContent}>
            <Text style={styles.analyticsTitle}>View Analytics</Text>
            <Text style={styles.analyticsText}>
              Track your emotional patterns
            </Text>
          </View>
        </TouchableOpacity>

        {data.journalEntries && data.journalEntries.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              <TouchableOpacity onPress={() => router.push('/progress')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.triggersContainer}>
              {data.journalEntries.slice(0, 3).map(entry => (
                <View key={entry.id} style={styles.triggerCard}>
                  <View style={styles.triggerHeader}>
                    <Text style={styles.journalEmoji}>{entry.emotionEmoji} {entry.emotion}</Text>
                    <Text style={styles.triggerTime}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.triggerSituation} numberOfLines={2}>
                    {entry.gratitude}
                  </Text>
                </View>
              ))}
            </View>
          </>
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
              <Text style={styles.modalTitle}>Meditation Timer</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            {meditationPhase === 'setup' && (
              <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
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
                    <Text style={styles.timeLabelText}>minutes</Text>
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
              </ScrollView>
            )}

            {meditationPhase === 'meditating' && (
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
                      <Text style={styles.timerDisplayText}>{formatTime(timeRemaining)}</Text>
                      <Text style={styles.timerLabelText}>remaining</Text>
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

            {meditationPhase === 'complete' && (
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
                    onPress={closeMeditationModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneButtonText}>Finish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>

        <Modal
          visible={showSoundPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSoundPicker(false)}
        >
          <View style={styles.soundModalOverlay}>
            <View style={styles.soundModalContent}>
              <View style={styles.soundModalHeader}>
                <Text style={styles.soundModalTitle}>Select End Sound</Text>
                <TouchableOpacity
                  onPress={() => setShowSoundPicker(false)}
                  style={styles.soundModalCloseButton}
                >
                  <Text style={styles.soundModalCloseText}>Done</Text>
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
      </Modal>

      <Modal
        visible={showJournalModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeJournalModal}
      >
        <SafeAreaView style={styles.journalModalSafeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.journalModalContainer}
          >
            <View style={styles.journalHeader}>
              <TouchableOpacity onPress={closeJournalModal} style={styles.journalCloseBtn}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={styles.journalHeaderTitle}>Quick Journal</Text>
              <TouchableOpacity 
                onPress={saveJournalEntry} 
                style={[styles.journalSaveBtn, (!journalText.trim() || !selectedEmotion) && styles.journalSaveBtnDisabled]}
                disabled={!journalText.trim() || !selectedEmotion}
              >
                <Send size={20} color={journalText.trim() && selectedEmotion ? Colors.light.primary : Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.journalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.emotionSection}>
                <Text style={styles.emotionLabel}>How are you feeling?</Text>
                <View style={styles.emotionGrid}>
                  {EMOTIONS.map((emotion) => (
                    <TouchableOpacity
                      key={emotion.label}
                      style={[
                        styles.emotionChip,
                        selectedEmotion?.label === emotion.label && styles.emotionChipSelected,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setSelectedEmotion(emotion);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                      <Text style={[
                        styles.emotionChipText,
                        selectedEmotion?.label === emotion.label && styles.emotionChipTextSelected,
                      ]}>{emotion.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputModeToggle}>
                <TouchableOpacity
                  style={[styles.modeBtn, inputMode === 'voice' && styles.modeBtnActive]}
                  onPress={() => setInputMode('voice')}
                >
                  <Mic size={18} color={inputMode === 'voice' ? '#FFF' : Colors.light.textSecondary} />
                  <Text style={[styles.modeBtnText, inputMode === 'voice' && styles.modeBtnTextActive]}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]}
                  onPress={() => setInputMode('text')}
                >
                  <Keyboard size={18} color={inputMode === 'text' ? '#FFF' : Colors.light.textSecondary} />
                  <Text style={[styles.modeBtnText, inputMode === 'text' && styles.modeBtnTextActive]}>Type</Text>
                </TouchableOpacity>
              </View>

              {inputMode === 'voice' ? (
                <View style={styles.voiceSection}>
                  <Text style={styles.voiceHint}>
                    {isRecording ? 'Listening... tap to stop' : isTranscribing ? 'Processing...' : 'Tap to speak'}
                  </Text>
                  <Animated.View style={[
                    styles.micButtonContainer,
                    { transform: [{ scale: recordingPulse }] },
                  ]}>
                    <TouchableOpacity
                      style={[
                        styles.micButton,
                        isRecording && styles.micButtonRecording,
                      ]}
                      onPress={handleMicPress}
                      disabled={isTranscribing}
                      activeOpacity={0.8}
                    >
                      {isTranscribing ? (
                        <ActivityIndicator size="large" color="#FFF" />
                      ) : isRecording ? (
                        <MicOff size={48} color="#FFF" />
                      ) : (
                        <Mic size={48} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.textSection}>
                  <TextInput
                    style={styles.journalTextInput}
                    placeholder="What's on your mind?"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={journalText}
                    onChangeText={setJournalText}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}

              {journalText.trim() !== '' && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>Your entry</Text>
                  <View style={styles.previewCard}>
                    <Text style={styles.previewText}>{journalText}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {journalText.trim() && selectedEmotion && (
              <View style={styles.journalFooter}>
                <TouchableOpacity
                  style={styles.saveEntryBtn}
                  onPress={saveJournalEntry}
                  activeOpacity={0.8}
                >
                  <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveEntryBtnText}>Save Entry</Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
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
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  checkInBanner: {
    backgroundColor: '#FFF0ED',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
    marginLeft: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  bannerArrow: {
    marginLeft: 12,
  },
  bannerArrowText: {
    fontSize: 24,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionLink: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionCardPrimary: {
    backgroundColor: Colors.light.primary,
  },
  actionCardSecondary: {
    backgroundColor: Colors.light.secondary,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIconPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionIconSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionCardMeditation: {
    backgroundColor: '#6366F1',
  },
  actionIconMeditation: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.card,
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 15,
    color: Colors.light.card,
    opacity: 0.9,
    lineHeight: 22,
  },
  goalsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  triggersContainer: {
    gap: 12,
    marginBottom: 32,
  },
  triggerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  triggerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  triggerEmotion: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  triggerIntensity: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  triggerSituation: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  triggerTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  journalEmoji: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  bottomSpacer: {
    height: 40,
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
    paddingHorizontal: 24,
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 24,
    paddingTop: 40,
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
  timeLabelText: {
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
  timerDisplayText: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    letterSpacing: -1,
  },
  timerLabelText: {
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
    backgroundColor: '#F5F0FA',
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
  soundModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  soundModalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  soundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  soundModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  soundModalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  soundModalCloseText: {
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
  quoteCard: {
    backgroundColor: '#FFF9F5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteIconContainer: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.light.text,
    fontWeight: '500',
    fontStyle: 'italic' as const,
  },
  analyticsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsContent: {
    flex: 1,
    marginLeft: 16,
  },
  analyticsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  analyticsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  journalModalSafeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  journalModalContainer: {
    flex: 1,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  journalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  journalSaveBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalSaveBtnDisabled: {
    opacity: 0.5,
  },
  journalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emotionSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    gap: 6,
  },
  emotionChipSelected: {
    backgroundColor: '#F5F0FA',
    borderColor: Colors.light.primary,
  },
  emotionEmoji: {
    fontSize: 18,
  },
  emotionChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
  },
  emotionChipTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modeBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  modeBtnTextActive: {
    color: '#FFF',
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  voiceHint: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  micButtonContainer: {
    marginBottom: 24,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  textSection: {
    marginBottom: 24,
  },
  journalTextInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 160,
    borderWidth: 1,
    borderColor: Colors.light.border,
    lineHeight: 24,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  previewEmotion: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  journalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveEntryBtn: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveEntryBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});
