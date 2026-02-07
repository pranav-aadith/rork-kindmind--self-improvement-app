import { router } from 'expo-router';
import { Heart, BookOpen, Flower, BarChart3, Sparkles, Timer, Play, Pause, RotateCcw, Minus, Plus, X, Check, Volume2, ChevronDown, Mic, MicOff, Keyboard, Send, LayoutGrid, Copy, Download, ChevronRight, Wand2 } from 'lucide-react-native';
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
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useAudioPlayer } from 'expo-audio';
import { Audio } from 'expo-av';
import { generateText } from '@rork-ai/toolkit-sdk';
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
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

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

  const [journalPrompt, setJournalPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [selectedWidgetStyle, setSelectedWidgetStyle] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isExportingWidget, setIsExportingWidget] = useState(false);
  const widgetPreviewRef = useRef<View>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const respData = await response.json();
      console.log('Transcription result:', respData);

      if (respData.text) {
        setJournalText(prev => prev ? prev + ' ' + respData.text : respData.text);
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

  const generateJournalPrompt = async () => {
    setIsGeneratingPrompt(true);
    triggerHaptic();
    try {
      const emotionContext = selectedEmotion ? `The user is currently feeling ${selectedEmotion.label.toLowerCase()}.` : '';
      
      const promptCategories = [
        'gratitude and appreciation',
        'self-discovery and identity',
        'relationships and connections',
        'dreams, goals, and aspirations',
        'mindfulness and present moment',
        'personal growth and learning',
        'challenges and resilience',
        'creativity and imagination',
        'memories and nostalgia',
        'values and beliefs',
        'self-compassion and kindness',
        'nature and surroundings',
        'emotions and feelings',
        'daily observations',
        'future hopes',
        'inner strength',
        'simple pleasures',
        'letting go',
        'boundaries and self-care',
        'curiosity and wonder',
        'body awareness and physical sensations',
        'childhood and innocence',
        'forgiveness and healing',
        'adventure and exploration',
        'silence and solitude',
        'laughter and joy',
        'home and belonging',
        'courage and fears',
        'seasons and change',
        'friendship and trust',
        'purpose and meaning',
        'rest and restoration',
        'creativity and expression',
        'learning from mistakes',
        'moments of connection',
        'small acts of kindness',
        'sensory experiences',
        'time and perspective',
        'intuition and inner voice',
        'comfort and safety'
      ];
      
      const promptStyles = [
        'Frame it as a "What if..." question.',
        'Make it a reflective statement to complete, like "Today I noticed..." or "I feel most at peace when..."',
        'Ask about a specific memory or moment.',
        'Make it open-ended and thought-provoking.',
        'Frame it as a gentle invitation, like "Describe..." or "Explore..."',
        'Ask about contrasts, like "What brings you energy vs. what drains you?"',
        'Frame it as a letter to someone (past self, future self, a loved one).',
        'Ask about a metaphor, like "If your emotions were weather, what would today be?"',
        'Make it sensory-focused, asking about what they saw, heard, or felt.',
        'Frame it as gratitude for something unexpected or overlooked.',
        'Ask about a lesson learned recently.',
        'Make it about small details that often go unnoticed.',
        'Frame it as advice they would give to a friend.',
        'Ask about their ideal day or moment.',
        'Make it about permission—what do they need to give themselves permission to do or feel?'
      ];
      
      const promptTones = [
        'Be warm, gentle, and nurturing.',
        'Be curious and playful.',
        'Be deep and philosophical.',
        'Be light and encouraging.',
        'Be introspective and calm.',
        'Be hopeful and uplifting.',
        'Be grounding and present-focused.'
      ];
      
      const promptDepths = [
        'Keep it simple and accessible.',
        'Make it thought-provoking but not overwhelming.',
        'Invite deeper exploration and vulnerability.',
        'Focus on everyday moments with fresh perspective.'
      ];
      
      const randomCategory = promptCategories[Math.floor(Math.random() * promptCategories.length)];
      const randomStyle = promptStyles[Math.floor(Math.random() * promptStyles.length)];
      const randomTone = promptTones[Math.floor(Math.random() * promptTones.length)];
      const randomDepth = promptDepths[Math.floor(Math.random() * promptDepths.length)];
      
      const hour = new Date().getHours();
      let timeContext = '';
      if (hour < 12) {
        timeContext = 'It is morning, a time for fresh starts.';
      } else if (hour < 17) {
        timeContext = 'It is afternoon, a time for reflection mid-day.';
      } else {
        timeContext = 'It is evening, a time for winding down and processing the day.';
      }
      
      const result = await generateText({
        messages: [
          {
            role: 'user',
            content: `You are a thoughtful journaling assistant for a mental wellness app. Generate a single, unique journal prompt about ${randomCategory}. ${emotionContext} ${timeContext} ${randomStyle} ${randomTone} ${randomDepth} Keep it under 20 words. Make each prompt feel fresh, creative, and different from typical journaling prompts. Avoid clichés. Only return the prompt text, nothing else.`,
          },
        ],
      });
      console.log('[Journal] Generated prompt:', result, 'Category:', randomCategory, 'Style:', randomStyle);
      setJournalPrompt(result);
    } catch (err) {
      console.error('[Journal] Failed to generate prompt:', err);
      const fallbackPrompts = [
        'What moment today made you feel most alive?',
        'What are you grateful for right now?',
        'What would you tell your younger self?',
        'What small joy did you notice today?',
        'What challenge helped you grow recently?',
        'Who made you smile today, and why?',
        'What does peace look like for you?',
        'What are you ready to let go of?',
        'If your heart could speak, what would it say?',
        'What color describes your mood right now?',
        'What sound brings you comfort?',
        'Describe a place where you feel completely safe.',
        'What are you curious about lately?',
        'What would "enough" look like today?',
        'What did you learn about yourself this week?',
        'What boundary do you need to honor?',
        'What would your future self thank you for?',
        'What feels heavy right now that you could set down?',
        'What unexpected moment brought you joy recently?',
        'If today had a soundtrack, what would it be?',
        'What permission do you need to give yourself?',
        'What part of your routine brings you peace?',
        'Describe someone who made you feel seen today.',
        'What small thing are you looking forward to?',
        'What would kindness to yourself look like right now?'
      ];
      setJournalPrompt(fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]);
    } finally {
      setIsGeneratingPrompt(false);
    }
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
    setJournalPrompt('');
    setInputMode('voice');
  };

  const WIDGET_STYLES = [
    { id: 0, name: 'Warm Sunrise', bg: ['#FFF9F5', '#FFE8DC'], accent: '#E8A87C', textColor: '#1A1A1A' },
    { id: 1, name: 'Ocean Calm', bg: ['#E8F4F8', '#D0E8F2'], accent: '#4A9E8E', textColor: '#1A1A1A' },
    { id: 2, name: 'Lavender', bg: ['#F5F0FA', '#E8DFF5'], accent: '#8B7CB8', textColor: '#1A1A1A' },
    { id: 3, name: 'Forest', bg: ['#E8F5E9', '#C8E6C9'], accent: '#4A9E8E', textColor: '#1A1A1A' },
    { id: 4, name: 'Midnight', bg: ['#D4C8E8', '#C5B8DA'], accent: '#B5A8D6', textColor: '#4A4545' },
    { id: 5, name: 'Golden', bg: ['#FFF3E0', '#FFE0B2'], accent: '#D4A373', textColor: '#1A1A1A' },
  ];

  const copyQuote = async () => {
    await Clipboard.setStringAsync(dailyQuote);
    triggerHaptic();
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const shareQuoteAsImage = async () => {
    triggerHaptic();
    setIsExportingWidget(true);
    
    try {
      if (Platform.OS === 'web') {
        console.log('[Widget] Generating PNG for web');
        const style = WIDGET_STYLES[selectedWidgetStyle];
        const svg = generateWidgetSvg(dailyQuote, style);
        
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const pngUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `kindmind-quote-${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(pngUrl);
              }
              URL.revokeObjectURL(svgUrl);
              setIsExportingWidget(false);
              setCopiedToast(true);
              setTimeout(() => setCopiedToast(false), 2000);
            }, 'image/png');
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          setIsExportingWidget(false);
          Alert.alert('Error', 'Failed to generate image.');
        };
        img.src = svgUrl;
      } else {
        console.log('[Widget] Capturing view for native');
        if (widgetPreviewRef.current) {
          const uri = await captureRef(widgetPreviewRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
          
          console.log('[Widget] Captured URI:', uri);
          
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Share Quote',
              UTI: 'public.png',
            });
          } else {
            Alert.alert('Saved', 'Your quote image is ready!');
          }
        }
        setIsExportingWidget(false);
      }
    } catch (error) {
      console.error('[Widget] Export error:', error);
      setIsExportingWidget(false);
      Alert.alert('Error', 'Failed to export quote image.');
    }
  };

  const generateWidgetSvg = (quote: string, style: typeof WIDGET_STYLES[0]) => {
    const width = 800;
    const height = 500;
    const padding = 48;
    
    const maxCharsPerLine = 45;
    const words = quote.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    const escapeXml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    const quoteLines = lines.map((line, i) => {
      const y = 200 + i * 36;
      return `<text x="${padding + 24}" y="${y}" fill="${style.textColor}" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-style="italic">"${escapeXml(line)}${i === lines.length - 1 ? '"' : ''}</text>`;
    }).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${style.bg[0]}" />
      <stop offset="100%" stop-color="${style.bg[1]}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg)" rx="32" />
  <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" fill="${style.bg[1]}" rx="24" />
  <rect x="${padding}" y="${padding}" width="6" height="${height - padding * 2}" fill="${style.accent}" rx="3" />
  ${quoteLines}
  <text x="${padding + 24}" y="${height - padding - 24}" fill="${style.textColor}" font-family="Arial, sans-serif" font-size="14" opacity="0.5">KindMind</text>
</svg>`;
  };

  const progress = 1 - timeRemaining / selectedTime;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>{getTimeOfDay()}</Text>
          <Text style={styles.username}>{data.username || 'there'}</Text>
        </Animated.View>

        <Animated.View style={[styles.quoteCard, { opacity: quoteAnim, transform: [{ scale: quoteAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}>
          <View style={styles.quoteAccent} />
          <View style={styles.quoteContent}>
            <Text style={styles.quoteText}>{dailyQuote}</Text>
            <View style={styles.quoteActions}>
              <TouchableOpacity
                style={styles.quoteActionBtn}
                onPress={() => setShowWidgetModal(true)}
                activeOpacity={0.7}
              >
                <LayoutGrid size={14} color={Colors.light.textSecondary} />
                <Text style={styles.quoteActionText}>Widget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {!hasCheckedInToday && (
          <TouchableOpacity
            style={styles.checkInBanner}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.7}
          >
            <View style={styles.checkInLeft}>
              <View style={styles.checkInDot} />
              <View>
                <Text style={styles.bannerTitle}>Daily Check-In</Text>
                <Text style={styles.bannerText}>How was your day?</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}

        <Animated.View style={[styles.streakCard, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.streakIconWrap}>
            <Flower size={22} color={Colors.light.secondary} />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{data.currentStreak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <Animated.View style={[styles.actionCardWrap, { opacity: card1Anim, transform: [{ scale: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: Colors.light.primary }]}
              onPress={() => setShowJournalModal(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <BookOpen size={22} color="#FFF" />
              </View>
              <Text style={[styles.actionTitle, { color: '#FFF' }]}>Journal</Text>
              <Text style={[styles.actionDesc, { color: 'rgba(255,255,255,0.7)' }]}>Write your thoughts</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.actionRow}>
            <Animated.View style={[styles.actionCardHalf, { opacity: card2Anim, transform: [{ scale: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionCardSmall, { backgroundColor: Colors.light.secondary }]}
                onPress={() => router.push('/pause')}
                activeOpacity={0.85}
              >
                <Heart size={20} color="#FFF" />
                <Text style={[styles.actionTitleSmall, { color: '#FFF' }]}>Pause</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.actionCardHalf, { opacity: card3Anim, transform: [{ scale: card3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionCardSmall, { backgroundColor: Colors.light.accent }]}
                onPress={() => setShowMeditationModal(true)}
                activeOpacity={0.85}
              >
                <Timer size={20} color="#FFF" />
                <Text style={[styles.actionTitleSmall, { color: '#FFF' }]}>Meditate</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {data.goals.filter(g => g.selected).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Goals</Text>
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
          activeOpacity={0.7}
        >
          <View style={styles.analyticsLeft}>
            <BarChart3 size={20} color={Colors.light.secondary} />
            <View>
              <Text style={styles.analyticsTitle}>View Analytics</Text>
              <Text style={styles.analyticsText}>Track your emotional patterns</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.light.textTertiary} />
        </TouchableOpacity>

        {data.journalEntries && data.journalEntries.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              <TouchableOpacity onPress={() => router.push('/progress')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.entriesContainer}>
              {data.journalEntries.slice(0, 3).map(entry => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryEmoji}>{entry.emotionEmoji}</Text>
                    <Text style={styles.entryEmotion}>{entry.emotion}</Text>
                    <Text style={styles.entryTime}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.entryText} numberOfLines={2}>
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
                <X size={22} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Meditation</Text>
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
                    <Minus size={22} color={Colors.light.text} />
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
                    <Plus size={22} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.presetsContainer}>
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
                  <Text style={styles.fieldLabel}>End Sound</Text>
                  <TouchableOpacity
                    style={styles.soundSelector}
                    onPress={() => setShowSoundPicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.soundSelectorLeft}>
                      <Volume2 size={18} color={Colors.light.secondary} />
                      <Text style={styles.soundSelectorText}>{selectedSound.label}</Text>
                    </View>
                    <ChevronDown size={18} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                  {selectedSound.url ? (
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={previewSound}
                      activeOpacity={0.7}
                    >
                      <Play size={12} color={Colors.light.secondary} />
                      <Text style={styles.previewButtonText}>Preview</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={startMeditation}
                  activeOpacity={0.8}
                >
                  <Play size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.startButtonText}>Begin</Text>
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
                          styles.progressFillCircle,
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
                    <RotateCcw size={22} color={Colors.light.textSecondary} />
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
                      <Pause size={28} color="#FFF" />
                    ) : (
                      <Play size={28} color="#FFF" style={{ marginLeft: 3 }} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.controlButton} />
                </View>
              </View>
            )}

            {meditationPhase === 'complete' && (
              <View style={styles.completeContent}>
                <View style={styles.completeIconContainer}>
                  <View style={styles.completeIcon}>
                    <Check size={40} color="#FFF" />
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
                  </Text>
                </View>

                <View style={styles.completeButtons}>
                  <TouchableOpacity
                    style={styles.anotherButton}
                    onPress={resetMeditation}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={18} color={Colors.light.text} style={{ marginRight: 8 }} />
                    <Text style={styles.anotherButtonText}>Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={closeMeditationModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
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
                <Text style={styles.soundModalTitle}>End Sound</Text>
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
                        size={18}
                        color={selectedSound.id === sound.id ? Colors.light.secondary : Colors.light.textSecondary}
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
                      <Check size={18} color={Colors.light.secondary} />
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
                <X size={22} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={styles.journalHeaderTitle}>Journal</Text>
              <TouchableOpacity 
                onPress={saveJournalEntry} 
                style={[styles.journalSaveBtn, (!journalText.trim() || !selectedEmotion) && styles.journalSaveBtnDisabled]}
                disabled={!journalText.trim() || !selectedEmotion}
              >
                <Send size={18} color={journalText.trim() && selectedEmotion ? Colors.light.text : Colors.light.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.journalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.emotionSection}>
                <Text style={styles.fieldLabel}>How are you feeling?</Text>
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
                  <Mic size={16} color={inputMode === 'voice' ? '#FFF' : Colors.light.textSecondary} />
                  <Text style={[styles.modeBtnText, inputMode === 'voice' && styles.modeBtnTextActive]}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]}
                  onPress={() => setInputMode('text')}
                >
                  <Keyboard size={16} color={inputMode === 'text' ? '#FFF' : Colors.light.textSecondary} />
                  <Text style={[styles.modeBtnText, inputMode === 'text' && styles.modeBtnTextActive]}>Type</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.promptSection}>
                <TouchableOpacity
                  style={styles.generatePromptBtn}
                  onPress={generateJournalPrompt}
                  disabled={isGeneratingPrompt}
                  activeOpacity={0.7}
                >
                  {isGeneratingPrompt ? (
                    <ActivityIndicator size="small" color={Colors.light.secondary} />
                  ) : (
                    <Wand2 size={16} color={Colors.light.secondary} />
                  )}
                  <Text style={styles.generatePromptText}>
                    {isGeneratingPrompt ? 'Generating...' : 'Generate a prompt'}
                  </Text>
                </TouchableOpacity>
                {journalPrompt !== '' && (
                  <TouchableOpacity
                    style={styles.promptCard}
                    onPress={() => {
                      triggerHaptic();
                      setJournalText(journalPrompt);
                      setInputMode('text');
                    }}
                    activeOpacity={0.7}
                  >
                    <Sparkles size={14} color={Colors.light.accent} />
                    <Text style={styles.promptCardText}>{journalPrompt}</Text>
                    <Text style={styles.promptCardHint}>Tap to use</Text>
                  </TouchableOpacity>
                )}
              </View>

              {inputMode === 'voice' ? (
                <View style={styles.voiceSection}>
                  <Text style={styles.voiceHint}>
                    {isRecording ? 'Listening...' : isTranscribing ? 'Processing...' : 'Tap to speak'}
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
                        <MicOff size={40} color="#FFF" />
                      ) : (
                        <Mic size={40} color="#FFF" />
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
                    placeholderTextColor={Colors.light.textTertiary}
                    value={journalText}
                    onChangeText={setJournalText}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}

              {journalText.trim() !== '' && (
                <View style={styles.previewSection}>
                  <Text style={styles.fieldLabel}>Preview</Text>
                  <View style={styles.previewCard}>
                    {selectedEmotion && (
                      <Text style={styles.previewEmotion}>{selectedEmotion.emoji} {selectedEmotion.label}</Text>
                    )}
                    <Text style={styles.previewText}>{journalText}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {!!journalText.trim() && !!selectedEmotion && (
              <View style={styles.journalFooter}>
                <TouchableOpacity
                  style={styles.saveEntryBtn}
                  onPress={saveJournalEntry}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveEntryBtnText}>Save Entry</Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showWidgetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWidgetModal(false)}
      >
        <SafeAreaView style={styles.widgetModalSafeArea}>
          <View style={styles.widgetModalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowWidgetModal(false)} style={styles.modalCloseBtn}>
                <X size={22} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Quote Widget</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            <ScrollView style={styles.widgetModalContent} contentContainerStyle={styles.widgetModalContentContainer}>
              <View 
                ref={widgetPreviewRef}
                collapsable={false}
                style={[
                  styles.widgetPreview,
                  { backgroundColor: WIDGET_STYLES[selectedWidgetStyle].bg[0] }
                ]}
              >
                <View style={[
                  styles.widgetPreviewInner,
                  { backgroundColor: WIDGET_STYLES[selectedWidgetStyle].bg[1] }
                ]}>
                  <View style={[
                    styles.widgetAccentBar,
                    { backgroundColor: WIDGET_STYLES[selectedWidgetStyle].accent }
                  ]} />
                  <View style={styles.widgetPreviewContent}>
                    <Sparkles size={20} color={WIDGET_STYLES[selectedWidgetStyle].accent} />
                    <Text style={[
                      styles.widgetQuoteText,
                      { color: WIDGET_STYLES[selectedWidgetStyle].textColor }
                    ]}>
                      {`"${dailyQuote}"`}
                    </Text>
                    <Text style={[
                      styles.widgetDateText,
                      { color: WIDGET_STYLES[selectedWidgetStyle].textColor, opacity: 0.5 }
                    ]}>
                      KindMind
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Style</Text>
              <View style={styles.widgetStylesGrid}>
                {WIDGET_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.widgetStyleOption,
                      { backgroundColor: style.bg[0] },
                      selectedWidgetStyle === style.id && styles.widgetStyleOptionSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedWidgetStyle(style.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.widgetStyleInner, { backgroundColor: style.bg[1] }]}>
                      <View style={[styles.widgetStyleAccent, { backgroundColor: style.accent }]} />
                    </View>
                    <Text style={[
                      styles.widgetStyleName,
                      selectedWidgetStyle === style.id && styles.widgetStyleNameSelected
                    ]}>{style.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.widgetActions}>
                <TouchableOpacity
                  style={styles.widgetActionBtn}
                  onPress={copyQuote}
                  activeOpacity={0.7}
                >
                  <Copy size={18} color={Colors.light.text} />
                  <Text style={styles.widgetActionText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.widgetActionBtn, styles.widgetShareBtn]}
                  onPress={shareQuoteAsImage}
                  activeOpacity={0.7}
                  disabled={isExportingWidget}
                >
                  {isExportingWidget ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Download size={18} color="#FFF" />
                      <Text style={styles.widgetShareText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            {copiedToast && (
              <View style={styles.copiedToast}>
                <Check size={16} color="#FFF" />
                <Text style={styles.copiedToastText}>Copied!</Text>
              </View>
            )}
          </View>
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
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  username: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  quoteCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  quoteAccent: {
    width: 4,
    backgroundColor: Colors.light.accent,
  },
  quoteContent: {
    flex: 1,
    padding: 18,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.text,
    fontWeight: '400' as const,
    fontStyle: 'italic' as const,
    letterSpacing: 0.1,
  },
  quoteActions: {
    flexDirection: 'row',
    marginTop: 14,
  },
  quoteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: Colors.light.subtle,
    borderRadius: 8,
  },
  quoteActionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
  },
  checkInBanner: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkInDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.secondary,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 1,
  },
  bannerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 28,
    gap: 14,
  },
  streakIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '600' as const,
  },
  actionsGrid: {
    gap: 12,
    marginBottom: 28,
  },
  actionCardWrap: {},
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCardHalf: {
    flex: 1,
  },
  actionCard: {
    borderRadius: 16,
    padding: 20,
  },
  actionCardSmall: {
    padding: 18,
    alignItems: 'flex-start',
    gap: 12,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  actionTitleSmall: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  actionDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  goalsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 28,
    gap: 14,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.secondary,
  },
  goalText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  analyticsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  analyticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 1,
  },
  analyticsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  entriesContainer: {
    gap: 10,
    marginBottom: 28,
  },
  entryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  entryEmoji: {
    fontSize: 18,
  },
  entryEmotion: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  entryTime: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  entryText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
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
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 24,
    paddingTop: 36,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 28,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeTextContainer: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 52,
    fontWeight: '200' as const,
    color: Colors.light.text,
    letterSpacing: -2,
  },
  timeLabelText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: -2,
  },
  presetsContainer: {
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.subtle,
  },
  presetButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  presetText: {
    fontSize: 13,
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
    backgroundColor: Colors.light.subtle,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  soundSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  soundSelectorText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingVertical: 6,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.secondary,
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    fontWeight: '300' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  meditatingSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 56,
  },
  timerGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.light.subtle,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 110,
    overflow: 'hidden',
  },
  progressFillCircle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.subtle,
  },
  timerInner: {
    alignItems: 'center',
    zIndex: 1,
  },
  timerDisplayText: {
    fontSize: 44,
    fontWeight: '200' as const,
    color: Colors.light.text,
    letterSpacing: -1,
  },
  timerLabelText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 28,
  },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  completeSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  completeCard: {
    backgroundColor: Colors.light.subtle,
    borderRadius: 16,
    padding: 20,
    marginBottom: 36,
    width: '100%',
  },
  completeCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  completeCardText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  completeButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  anotherButton: {
    flex: 1,
    backgroundColor: Colors.light.subtle,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  doneButton: {
    flex: 1,
    backgroundColor: Colors.light.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
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
    paddingBottom: 40,
    maxHeight: '55%',
  },
  soundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  soundModalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  soundModalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  soundModalCloseText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.secondary,
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
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  soundOptionActive: {
    backgroundColor: Colors.light.subtle,
  },
  soundOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundOptionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  soundOptionTextActive: {
    color: Colors.light.secondary,
    fontWeight: '600' as const,
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
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  journalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalHeaderTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  journalSaveBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalSaveBtnDisabled: {
    opacity: 0.4,
  },
  journalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emotionSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.light.subtle,
    gap: 6,
  },
  emotionChipSelected: {
    backgroundColor: Colors.light.primary,
  },
  emotionEmoji: {
    fontSize: 16,
  },
  emotionChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
  },
  emotionChipTextSelected: {
    color: '#FFF',
  },
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.subtle,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  modeBtnTextActive: {
    color: '#FFF',
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  voiceHint: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 28,
  },
  micButtonContainer: {
    marginBottom: 20,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  textSection: {
    marginBottom: 20,
  },
  journalTextInput: {
    backgroundColor: Colors.light.subtle,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 140,
    lineHeight: 22,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
  },
  previewEmotion: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  previewText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 21,
  },
  promptSection: {
    marginBottom: 16,
  },
  generatePromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  generatePromptText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.secondary,
  },
  promptCard: {
    marginTop: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.secondary,
    gap: 6,
  },
  promptCardText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.text,
    fontStyle: 'italic' as const,
    lineHeight: 22,
  },
  promptCardHint: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  journalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
  },
  saveEntryBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEntryBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  widgetModalSafeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  widgetModalContainer: {
    flex: 1,
  },
  widgetModalContent: {
    flex: 1,
  },
  widgetModalContentContainer: {
    padding: 20,
  },
  widgetPreview: {
    borderRadius: 20,
    padding: 4,
    marginBottom: 28,
  },
  widgetPreviewInner: {
    borderRadius: 16,
    padding: 20,
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  widgetAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  widgetPreviewContent: {
    paddingLeft: 12,
    gap: 14,
  },
  widgetQuoteText: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  widgetDateText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  widgetStylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  widgetStyleOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  widgetStyleOptionSelected: {
    borderColor: Colors.light.primary,
  },
  widgetStyleInner: {
    flex: 1,
    borderRadius: 11,
    position: 'relative',
    overflow: 'hidden',
  },
  widgetStyleAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  widgetStyleName: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  widgetStyleNameSelected: {
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  widgetActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  widgetActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.subtle,
  },
  widgetActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  widgetShareBtn: {
    backgroundColor: Colors.light.primary,
  },
  widgetShareText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  copiedToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copiedToastText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
