import { Sparkles, RotateCcw, Send, Mic, MicOff, Keyboard, X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useKindMind } from '@/providers/KindMindProvider';
import type { OnboardingAnswers } from '@/types';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';

type QuickPrompt = {
  id: string;
  title: string;
  emoji: string;
  prompt: string;
};

function formatKoraContext(params: {
  username: string;
  answers: OnboardingAnswers | null;
}): string {
  const usernameSafe = params.username?.trim() ?? '';
  const a = params.answers;

  const reactionSpeed = a?.reactionSpeed?.trim() || 'Unknown';
  const triggers = (a?.commonTriggers ?? []).filter(Boolean);
  const relationshipImpact = a?.relationshipImpact?.trim() || 'Unknown';
  const awareness = a?.awareness?.trim() || 'Unknown';
  const frequency = a?.frequency?.trim() || 'Unknown';

  return [
    `User name: ${usernameSafe.length > 0 ? usernameSafe : 'Unknown'}`,
    `Reaction speed: ${reactionSpeed}`,
    `Common triggers: ${triggers.length > 0 ? triggers.join(', ') : 'None listed'}`,
    `Relationship impact: ${relationshipImpact}`,
    `Awareness level: ${awareness}`,
    `Conflict frequency: ${frequency}`,
  ].join('\n');
}

function buildKoraPrompt(params: {
  username: string;
  answers: OnboardingAnswers | null;
  userMessage: string;
}): string {
  const context = formatKoraContext({ username: params.username, answers: params.answers });

  return [
    'You are Kora, a kindness coach: cozy friend + gentle mentor.',
    '',
    'Voice & vibe:',
    '- Warm, encouraging, non-judgmental.',
    '- Listen first. Reflect feelings back briefly.',
    '- Suggest kind actions, never command.',
    '- Keep messages short (1–4 sentences).',
    '- Gentle emojis are allowed, but use sparingly (🌱 💛 ✨).',
    '',
    'Personalize using the user profile:',
    context,
    '',
    'Personalization rules:',
    '1) If reaction speed is instant/quick, start with a tiny pause cue like "Take a breath…" or "One second…"',
    '2) If the situation touches a listed trigger, be extra non-defensive and validating.',
    '3) If awareness is after/rarely, keep it very simple and memorable.',
    '',
    'Now respond to the user message below:',
    params.userMessage,
  ].join('\n');
}

function extractText(parts: unknown): string {
  if (!Array.isArray(parts)) return '';
  const chunks: string[] = [];
  for (const part of parts) {
    if (part && typeof part === 'object' && 'type' in part && part.type === 'text') {
      const textPart = part as { type: 'text'; text?: string };
      if (typeof textPart.text === 'string' && textPart.text.length > 0) {
        chunks.push(textPart.text);
      }
    }
  }
  return chunks.join('');
}

export default function ResponsesScreen() {
  const { data } = useKindMind();
  const scrollRef = useRef<ScrollView | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const username = data.username ?? '';
  const answers = data.onboardingAnswers ?? null;

  const quickPrompts = useMemo<QuickPrompt[]>(
    () => [
      {
        id: 'q1',
        title: 'Gentle reply',
        emoji: '💬',
        prompt: 'Help me write a kind response to a message that upset me. Ask 1 question first if needed.',
      },
      {
        id: 'q2',
        title: 'Repair',
        emoji: '🤝',
        prompt: 'I snapped earlier. Help me repair with a short apology + next step.',
      },
      {
        id: 'q3',
        title: 'Boundaries',
        emoji: '🛡️',
        prompt: 'Help me set a boundary without sounding harsh.',
      },
      {
        id: 'q4',
        title: 'Before I text',
        emoji: '⏸️',
        prompt: 'I want to respond but I am activated. Help me pause and choose kinder words. Keep it simple.',
      },
    ],
    []
  );

  const agentResult = useRorkAgent({
    tools: {},
  });

  const messages = agentResult?.messages ?? [];
  const error = agentResult?.error ?? null;
  const sendMessage = agentResult?.sendMessage;
  const setMessages = agentResult?.setMessages;

  const [input, setInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const send = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || !sendMessage) return;

      console.log('[Kora] send', { length: trimmed.length, hasAnswers: !!answers, username });

      setIsSending(true);
      try {
        const prompt = buildKoraPrompt({
          username,
          answers,
          userMessage: trimmed,
        });

        await sendMessage(prompt);
        setInput('');
        setShowKeyboard(false);
      } catch (e) {
        console.error('[Kora] send error', e);
      } finally {
        setIsSending(false);
      }
    },
    [answers, sendMessage, username]
  );

  const onPressQuickPrompt = useCallback(
    (p: QuickPrompt) => {
      console.log('[Kora] quick prompt', p.id);
      void send(p.prompt);
    },
    [send]
  );

  const onReset = useCallback(() => {
    console.log('[Kora] reset');
    if (setMessages) {
      setMessages([]);
    }
    setInput('');
    setShowKeyboard(false);
  }, [setMessages]);

  const startRecording = useCallback(async () => {
    try {
      console.log('[Kora] Starting recording...');
      
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.error('[Kora] Audio permission denied');
          return;
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          isMeteringEnabled: false,
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });
        
        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
      }
    } catch (error) {
      console.error('[Kora] Failed to start recording:', error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      console.log('[Kora] Stopping recording...');
      setIsRecording(false);
      setIsTranscribing(true);
      
      let formData = new FormData();
      
      if (Platform.OS === 'web') {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder) {
          setIsTranscribing(false);
          return;
        }
        
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.stop();
        });
        
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        formData.append('audio', audioFile);
        mediaRecorderRef.current = null;
      } else {
        const recording = recordingRef.current;
        if (!recording) {
          setIsTranscribing(false);
          return;
        }
        
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        
        const uri = recording.getURI();
        if (!uri) {
          console.error('[Kora] No recording URI');
          setIsTranscribing(false);
          return;
        }
        
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        const audioFile = {
          uri,
          name: 'recording.' + fileType,
          type: 'audio/' + fileType,
        };
        
        formData.append('audio', audioFile as unknown as Blob);
        recordingRef.current = null;
      }
      
      console.log('[Kora] Transcribing audio...');
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const result = await response.json();
      console.log('[Kora] Transcription result:', result);
      
      if (result.text) {
        const transcribedText = result.text.trim();
        if (transcribedText) {
          void send(transcribedText);
        }
      }
    } catch (error) {
      console.error('[Kora] Failed to transcribe:', error);
    } finally {
      setIsTranscribing(false);
    }
  }, [send]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const renderedMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return [];
    return messages
      .filter(m => m && m.id && m.role && m.parts)
      .map(m => {
        const parts = Array.isArray(m.parts) ? m.parts : [];
        return {
          id: m.id,
          role: m.role,
          text: extractText(parts),
          hasToolPart: parts.some((p: unknown) => p && typeof p === 'object' && 'type' in p && p.type === 'tool'),
        };
      })
      .filter(m => m.text.length > 0 || m.hasToolPart);
  }, [messages]);

  const hasAnyMessages = renderedMessages.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} testID="responses-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        testID="responses-kb"
      >
        <View style={styles.header} testID="kora-header">
          <View style={styles.headerRow}>
            <View style={styles.titleSection}>
              <View style={styles.koraIndicator}>
                <View style={styles.koraIndicatorDot} />
              </View>
              <View>
                <Text style={styles.title}>Kora</Text>
                <Text style={styles.subtitle}>Your kindness coach</Text>
              </View>
            </View>

            {hasAnyMessages && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={onReset}
                activeOpacity={0.7}
                testID="kora-reset"
              >
                <RotateCcw size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!hasAnyMessages ? (
          <ScrollView 
            style={styles.emptyState}
            contentContainerStyle={styles.emptyStateContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Sparkles size={32} color={Colors.light.primary} />
                </View>
              </View>
              
              <Text style={styles.welcomeTitle}>
                Hey{username ? `, ${username}` : ''} 💛
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Tell me what&apos;s on your mind. I&apos;ll listen first, then help you find kinder words.
              </Text>
            </View>

            <View style={styles.mainActionSection}>
              <Animated.View style={[styles.micButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={[
                    styles.bigMicButton,
                    isRecording && styles.bigMicButtonRecording,
                    isTranscribing && styles.bigMicButtonTranscribing,
                  ]}
                  onPress={toggleRecording}
                  disabled={isSending || isTranscribing}
                  activeOpacity={0.85}
                  testID="kora-big-mic"
                >
                  {isTranscribing ? (
                    <ActivityIndicator color={Colors.light.card} size="large" />
                  ) : isRecording ? (
                    <MicOff size={40} color={Colors.light.card} />
                  ) : (
                    <Mic size={40} color={Colors.light.card} />
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              <Text style={styles.micHint}>
                {isTranscribing ? 'Processing...' : isRecording ? 'Tap to stop' : 'Tap to speak'}
              </Text>

              <TouchableOpacity
                style={styles.typeInsteadButton}
                onPress={() => setShowKeyboard(true)}
                activeOpacity={0.7}
              >
                <Keyboard size={16} color={Colors.light.textSecondary} />
                <Text style={styles.typeInsteadText}>Type instead</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickPromptsSection}>
              <Text style={styles.quickPromptsTitle}>Quick starts</Text>
              <View style={styles.quickPromptsGrid}>
                {quickPrompts.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.quickCard}
                    onPress={() => onPressQuickPrompt(p)}
                    activeOpacity={0.8}
                    testID={`kora-quick-${p.id}`}
                  >
                    <Text style={styles.quickCardEmoji}>{p.emoji}</Text>
                    <Text style={styles.quickCardTitle}>{p.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {!!error && (
              <View style={styles.errorCard} testID="kora-error">
                <Text style={styles.errorTitle}>Connection issue</Text>
                <Text style={styles.errorText}>Check your connection and try again.</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.thread}
            contentContainerStyle={styles.threadContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            testID="kora-thread"
          >
            {renderedMessages.map(m => {
              const isUser = m.role === 'user';

              return (
                <View
                  key={m.id}
                  style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}
                  testID={`kora-msg-${m.role}-${m.id}`}
                >
                  {!isUser && (
                    <View style={styles.messageAvatar}>
                      <Sparkles size={14} color={Colors.light.primary} />
                    </View>
                  )}
                  <View style={[styles.bubble, isUser ? styles.userBubble : styles.koraBubble]}>
                    {m.text.length > 0 ? (
                      <Text style={[styles.messageText, isUser ? styles.userText : styles.koraText]}>
                        {m.text}
                      </Text>
                    ) : (
                      <View style={styles.thinkingRow}>
                        <ActivityIndicator size="small" color={Colors.light.textSecondary} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isSending && (
              <View style={[styles.messageRow, styles.messageRowLeft]} testID="kora-thinking">
                <View style={styles.messageAvatar}>
                  <Sparkles size={14} color={Colors.light.primary} />
                </View>
                <View style={[styles.bubble, styles.koraBubble]}>
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={Colors.light.textSecondary} />
                    <Text style={styles.thinkingText}>Thinking...</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}

        {(showKeyboard || hasAnyMessages) && (
          <View style={styles.composerWrap} testID="kora-composer">
            <View style={styles.composer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type your message..."
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                multiline
                maxLength={600}
                testID="kora-input"
              />

              <TouchableOpacity
                style={[
                  styles.composerMicButton,
                  isRecording && styles.composerMicButtonRecording,
                ]}
                onPress={toggleRecording}
                disabled={isSending || isTranscribing}
                activeOpacity={0.8}
                testID="kora-mic"
              >
                {isTranscribing ? (
                  <ActivityIndicator color={Colors.light.primary} size="small" />
                ) : isRecording ? (
                  <MicOff size={20} color={Colors.light.card} />
                ) : (
                  <Mic size={20} color={Colors.light.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!input.trim() || isSending) && styles.sendButtonDisabled,
                ]}
                onPress={() => void send(input)}
                disabled={!input.trim() || isSending}
                activeOpacity={0.8}
                testID="kora-send"
              >
                {isSending ? (
                  <ActivityIndicator color={Colors.light.card} size="small" />
                ) : (
                  <Send size={20} color={Colors.light.card} />
                )}
              </TouchableOpacity>
            </View>

            {!hasAnyMessages && (
              <TouchableOpacity
                style={styles.closeKeyboardButton}
                onPress={() => setShowKeyboard(false)}
                activeOpacity={0.7}
              >
                <X size={14} color={Colors.light.textSecondary} />
                <Text style={styles.closeKeyboardText}>Back to voice</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.disclaimer} testID="kora-disclaimer">
          Kora is supportive, not a substitute for professional care.
        </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  koraIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.secondary + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  koraIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.secondary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
  },
  emptyStateContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  mainActionSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  micButtonContainer: {
    marginBottom: 12,
  },
  bigMicButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigMicButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  bigMicButtonTranscribing: {
    backgroundColor: Colors.light.secondary,
  },
  micHint: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  typeInsteadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.subtle,
    borderRadius: 10,
  },
  typeInsteadText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  quickPromptsSection: {
    marginBottom: 20,
  },
  quickPromptsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickCardEmoji: {
    fontSize: 20,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
  },
  thread: {
    flex: 1,
    paddingHorizontal: 16,
  },
  threadContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.light.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  koraBubble: {
    backgroundColor: Colors.light.card,
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  koraText: {
    color: Colors.light.text,
  },
  userText: {
    color: Colors.light.card,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  composerWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 5,
    gap: 5,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  composerMicButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerMicButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  closeKeyboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  closeKeyboardText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  disclaimer: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    opacity: 0.7,
  },
});
