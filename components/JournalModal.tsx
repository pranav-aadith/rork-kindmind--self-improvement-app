import { Sparkles, Send, Mic, MicOff, Keyboard, X, Check, Wand2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import React, { useState, useRef, useCallback } from 'react';
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
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { generateText } from '@rork-ai/toolkit-sdk';
import Colors from '@/constants/colors';

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

type EmotionType = typeof EMOTIONS[0];

interface JournalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: { gratitude: string; reflection: string; emotion: string; emotionEmoji: string }) => void;
}

export default function JournalModal({ visible, onClose, onSave }: JournalModalProps) {
  const [journalText, setJournalText] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingPulse = useRef(new Animated.Value(1)).current;
  const [journalPrompt, setJournalPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { console.log('Permission not granted'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: { extension: '.m4a', outputFormat: Audio.AndroidOutputFormat.MPEG_4, audioEncoder: Audio.AndroidAudioEncoder.AAC, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 },
        ios: { extension: '.wav', outputFormat: Audio.IOSOutputFormat.LINEARPCM, audioQuality: Audio.IOSAudioQuality.HIGH, sampleRate: 44100, numberOfChannels: 1, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
      });
      setRecording(newRecording);
      setIsRecording(true);
      triggerHaptic();
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(recordingPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      console.log('Recording started');
    } catch (err) { console.error('Failed to start recording', err); }
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
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null);
      if (uri) { await transcribeAudio(uri); }
    } catch (err) { console.error('Failed to stop recording', err); setRecording(null); }
  };

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const audioFile = { uri, name: 'recording.' + fileType, type: 'audio/' + fileType } as unknown as Blob;
      formData.append('audio', audioFile);
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Transcription failed');
      const respData = await response.json();
      console.log('Transcription result:', respData);
      if (respData.text) { setJournalText(prev => prev ? prev + ' ' + respData.text : respData.text); }
    } catch (err) { console.error('Transcription error:', err); }
    finally { setIsTranscribing(false); }
  };

  const handleMicPress = () => {
    if (isRecording) { stopRecording(); } else { startRecording(); }
  };

  const saveJournalEntry = () => {
    if (!journalText.trim() || !selectedEmotion) return;
    triggerHaptic();
    onSave({
      gratitude: journalText.trim(),
      reflection: '',
      emotion: selectedEmotion.label,
      emotionEmoji: selectedEmotion.emoji,
    });
    setJournalText('');
    setSelectedEmotion(null);
    setJournalPrompt('');
    setInputMode('voice');
    onClose();
  };

  const generateJournalPrompt = async () => {
    setIsGeneratingPrompt(true);
    triggerHaptic();
    try {
      const emotionContext = selectedEmotion ? `The user is currently feeling ${selectedEmotion.label.toLowerCase()}.` : '';
      const promptCategories = [
        'gratitude and appreciation', 'self-discovery and identity', 'relationships and connections',
        'dreams, goals, and aspirations', 'mindfulness and present moment', 'personal growth and learning',
        'challenges and resilience', 'creativity and imagination', 'memories and nostalgia',
        'values and beliefs', 'self-compassion and kindness', 'nature and surroundings',
        'emotions and feelings', 'daily observations', 'future hopes', 'inner strength',
        'simple pleasures', 'letting go', 'boundaries and self-care', 'curiosity and wonder',
        'body awareness and physical sensations', 'childhood and innocence', 'forgiveness and healing',
        'adventure and exploration', 'silence and solitude', 'laughter and joy', 'home and belonging',
        'courage and fears', 'seasons and change', 'friendship and trust', 'purpose and meaning',
        'rest and restoration', 'creativity and expression', 'learning from mistakes',
        'moments of connection', 'small acts of kindness', 'sensory experiences',
        'time and perspective', 'intuition and inner voice', 'comfort and safety',
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
      ];
      const promptTones = [
        'Be warm, gentle, and nurturing.', 'Be curious and playful.', 'Be deep and philosophical.',
        'Be light and encouraging.', 'Be introspective and calm.', 'Be hopeful and uplifting.',
        'Be grounding and present-focused.',
      ];
      const promptDepths = [
        'Keep it simple and accessible.', 'Make it thought-provoking but not overwhelming.',
        'Invite deeper exploration and vulnerability.', 'Focus on everyday moments with fresh perspective.',
      ];
      const randomCategory = promptCategories[Math.floor(Math.random() * promptCategories.length)];
      const randomStyle = promptStyles[Math.floor(Math.random() * promptStyles.length)];
      const randomTone = promptTones[Math.floor(Math.random() * promptTones.length)];
      const randomDepth = promptDepths[Math.floor(Math.random() * promptDepths.length)];
      const hour = new Date().getHours();
      let timeContext = '';
      if (hour < 12) { timeContext = 'It is morning, a time for fresh starts.'; }
      else if (hour < 17) { timeContext = 'It is afternoon, a time for reflection mid-day.'; }
      else { timeContext = 'It is evening, a time for winding down and processing the day.'; }

      const result = await generateText({
        messages: [{
          role: 'user',
          content: `You are a thoughtful journaling assistant for a mental wellness app. Generate a single, unique journal prompt about ${randomCategory}. ${emotionContext} ${timeContext} ${randomStyle} ${randomTone} ${randomDepth} Keep it under 20 words. Make each prompt feel fresh, creative, and different from typical journaling prompts. Avoid clichés. Only return the prompt text, nothing else.`,
        }],
      });
      console.log('[Journal] Generated prompt:', result, 'Category:', randomCategory);
      setJournalPrompt(result);
    } catch (err) {
      console.error('[Journal] Failed to generate prompt:', err);
      const fallbackPrompts = [
        'What moment today made you feel most alive?', 'What are you grateful for right now?',
        'What would you tell your younger self?', 'What small joy did you notice today?',
        'What challenge helped you grow recently?', 'Who made you smile today, and why?',
        'What does peace look like for you?', 'What are you ready to let go of?',
        'If your heart could speak, what would it say?', 'What color describes your mood right now?',
      ];
      setJournalPrompt(fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]);
    } finally { setIsGeneratingPrompt(false); }
  };

  const handleClose = () => {
    if (isRecording && recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
    }
    setJournalText('');
    setSelectedEmotion(null);
    setJournalPrompt('');
    setInputMode('voice');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Journal</Text>
            <TouchableOpacity
              onPress={saveJournalEntry}
              style={[styles.saveBtn, (!journalText.trim() || !selectedEmotion) && styles.saveBtnDisabled]}
              disabled={!journalText.trim() || !selectedEmotion}
            >
              <Send size={18} color={journalText.trim() && selectedEmotion ? Colors.light.text : Colors.light.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.emotionSection}>
              <Text style={styles.fieldLabel}>How are you feeling?</Text>
              <View style={styles.emotionGrid}>
                {EMOTIONS.map((emotion) => (
                  <TouchableOpacity
                    key={emotion.label}
                    style={[styles.emotionChip, selectedEmotion?.label === emotion.label && styles.emotionChipSelected]}
                    onPress={() => { triggerHaptic(); setSelectedEmotion(emotion); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                    <Text style={[styles.emotionChipText, selectedEmotion?.label === emotion.label && styles.emotionChipTextSelected]}>{emotion.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputModeToggle}>
              <TouchableOpacity style={[styles.modeBtn, inputMode === 'voice' && styles.modeBtnActive]} onPress={() => setInputMode('voice')}>
                <Mic size={16} color={inputMode === 'voice' ? '#FFF' : Colors.light.textSecondary} />
                <Text style={[styles.modeBtnText, inputMode === 'voice' && styles.modeBtnTextActive]}>Voice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]} onPress={() => setInputMode('text')}>
                <Keyboard size={16} color={inputMode === 'text' ? '#FFF' : Colors.light.textSecondary} />
                <Text style={[styles.modeBtnText, inputMode === 'text' && styles.modeBtnTextActive]}>Type</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.promptSection}>
              <TouchableOpacity style={styles.generatePromptBtn} onPress={generateJournalPrompt} disabled={isGeneratingPrompt} activeOpacity={0.7}>
                {isGeneratingPrompt ? (
                  <ActivityIndicator size="small" color={Colors.light.secondary} />
                ) : (
                  <Wand2 size={16} color={Colors.light.secondary} />
                )}
                <Text style={styles.generatePromptText}>{isGeneratingPrompt ? 'Generating...' : 'Generate a prompt'}</Text>
              </TouchableOpacity>
              {journalPrompt !== '' && (
                <TouchableOpacity
                  style={styles.promptCard}
                  onPress={() => { triggerHaptic(); setJournalText(journalPrompt); setInputMode('text'); }}
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
                <Animated.View style={[styles.micButtonContainer, { transform: [{ scale: recordingPulse }] }]}>
                  <TouchableOpacity
                    style={[styles.micButton, isRecording && styles.micButtonRecording]}
                    onPress={handleMicPress}
                    disabled={isTranscribing}
                    activeOpacity={0.8}
                  >
                    {isTranscribing ? <ActivityIndicator size="large" color="#FFF" /> : isRecording ? <MicOff size={40} color="#FFF" /> : <Mic size={40} color="#FFF" />}
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
                  {selectedEmotion && <Text style={styles.previewEmotion}>{selectedEmotion.emoji} {selectedEmotion.label}</Text>}
                  <Text style={styles.previewText}>{journalText}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {!!journalText.trim() && !!selectedEmotion && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.saveEntryBtn} onPress={saveJournalEntry} activeOpacity={0.8}>
                <Check size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveEntryBtnText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.light.border },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.light.text, letterSpacing: -0.2 },
  saveBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  content: { flex: 1, paddingHorizontal: 20 },
  emotionSection: { marginTop: 20, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.textSecondary, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  emotionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.light.subtle, gap: 6 },
  emotionChipSelected: { backgroundColor: Colors.light.primary },
  emotionEmoji: { fontSize: 16 },
  emotionChipText: { fontSize: 13, fontWeight: '500' as const, color: Colors.light.textSecondary },
  emotionChipTextSelected: { color: '#FFF' },
  inputModeToggle: { flexDirection: 'row', backgroundColor: Colors.light.subtle, borderRadius: 12, padding: 3, marginBottom: 20 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  modeBtnActive: { backgroundColor: Colors.light.primary },
  modeBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.textSecondary },
  modeBtnTextActive: { color: '#FFF' },
  promptSection: { marginBottom: 16 },
  generatePromptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: Colors.light.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, borderStyle: 'dashed' },
  generatePromptText: { fontSize: 14, fontWeight: '500' as const, color: Colors.light.secondary },
  promptCard: { marginTop: 10, backgroundColor: Colors.light.card, borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: Colors.light.secondary, gap: 6 },
  promptCardText: { fontSize: 15, fontWeight: '500' as const, color: Colors.light.text, fontStyle: 'italic' as const, lineHeight: 22 },
  promptCardHint: { fontSize: 11, fontWeight: '600' as const, color: Colors.light.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 2 },
  voiceSection: { alignItems: 'center', paddingVertical: 28 },
  voiceHint: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 28 },
  micButtonContainer: { marginBottom: 20 },
  micButton: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  micButtonRecording: { backgroundColor: '#FF3B30' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  recordingText: { fontSize: 13, fontWeight: '600' as const, color: '#FF3B30' },
  textSection: { marginBottom: 20 },
  journalTextInput: { backgroundColor: Colors.light.subtle, borderRadius: 14, padding: 16, fontSize: 15, color: Colors.light.text, minHeight: 140, lineHeight: 22 },
  previewSection: { marginBottom: 20 },
  previewCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16 },
  previewEmotion: { fontSize: 14, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 6 },
  previewText: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 21 },
  footer: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 0.5, borderTopColor: Colors.light.border },
  saveEntryBtn: { backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveEntryBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
});
