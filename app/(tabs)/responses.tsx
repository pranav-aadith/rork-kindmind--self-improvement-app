import { Sparkles, RotateCcw, Send, Mic, MicOff } from 'lucide-react-native';
import { Audio } from 'expo-av';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
    '1) If reaction speed is instant/quick, start with a tiny pause cue like “Take a breath…” or “One second…”',
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

  const username = data.username ?? '';
  const answers = data.onboardingAnswers ?? null;

  const quickPrompts = useMemo<QuickPrompt[]>(
    () => [
      {
        id: 'q1',
        title: 'Gentle reply',
        prompt:
          'Help me write a kind response to a message that upset me. Ask 1 question first if needed.',
      },
      {
        id: 'q2',
        title: 'Repair',
        prompt: 'I snapped earlier. Help me repair with a short apology + next step.',
      },
      {
        id: 'q3',
        title: 'Boundaries',
        prompt: 'Help me set a boundary without sounding harsh.',
      },
      {
        id: 'q4',
        title: 'Before I text',
        prompt:
          'I want to respond but I am activated. Help me pause and choose kinder words. Keep it simple.',
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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        setInput(prev => prev ? prev + ' ' + result.text : result.text);
      }
    } catch (error) {
      console.error('[Kora] Failed to transcribe:', error);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

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
        <View style={styles.bgOrbs} pointerEvents="none">
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />
          <View style={[styles.orb, styles.orb3]} />
        </View>

        <View style={styles.header} testID="kora-header">
          <View style={styles.headerTopRow}>
            <View style={styles.koraBadge} testID="kora-badge">
              <View style={styles.koraDot} />
              <Text style={styles.koraBadgeText}>Kora</Text>
              <View style={styles.koraBadgeDivider} />
              <Text style={styles.koraBadgeSub}>Kindness coach</Text>
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={onReset}
              activeOpacity={0.8}
              testID="kora-reset"
              accessibilityLabel="Reset chat"
            >
              <RotateCcw size={18} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title} testID="kora-title">
            Talk to Kora
          </Text>
          <Text style={styles.subtitle} testID="kora-subtitle">
            Cozy support + gentle guidance 🌱
          </Text>

          {!hasAnyMessages && (
            <View style={styles.welcomeCard} testID="kora-welcome">
              <View style={styles.welcomeRow}>
                <View style={styles.sparkleBubble}>
                  <Sparkles size={18} color={Colors.light.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeTitle}>
                    I’m here with you{(username?.trim() ?? '').length > 0 ? `, ${username.trim()}` : ''} 💛
                  </Text>
                  <Text style={styles.welcomeText}>
                    Tell me what happened. I’ll listen first, then help you find kinder words.
                  </Text>
                </View>
              </View>

              <View style={styles.quickRow} testID="kora-quick-prompts">
                {quickPrompts.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.quickChip}
                    onPress={() => onPressQuickPrompt(p)}
                    activeOpacity={0.85}
                    testID={`kora-quick-${p.id}`}
                  >
                    <Text style={styles.quickChipText}>{p.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!!error && (
            <View style={styles.errorCard} testID="kora-error">
              <Text style={styles.errorTitle}>Kora couldn’t reply</Text>
              <Text style={styles.errorText}>
                Check your connection and try again.
              </Text>
            </View>
          )}
        </View>

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
            const bubbleStyle = isUser ? styles.userBubble : styles.koraBubble;
            const textStyle = isUser ? styles.userText : styles.koraText;
            const meta = isUser ? 'You' : 'Kora';

            return (
              <View
                key={m.id}
                style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}
                testID={`kora-msg-${m.role}-${m.id}`}
              >
                <View style={[styles.bubble, bubbleStyle]}>
                  <Text style={styles.metaText}>{meta}</Text>
                  {m.text.length > 0 ? (
                    <Text style={[styles.messageText, textStyle]}>{m.text}</Text>
                  ) : (
                    <View style={styles.thinkingRow}>
                      <ActivityIndicator size="small" color={Colors.light.textSecondary} />
                      <Text style={styles.thinkingText}>Thinking…</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {isSending && (
            <View style={[styles.messageRow, styles.messageRowRight]} testID="kora-sending">
              <View style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.metaText}>You</Text>
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={Colors.light.card} />
                  <Text style={[styles.thinkingText, { color: Colors.light.card }]}>Sending…</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 12 }} />
        </ScrollView>

        <View style={styles.composerWrap} testID="kora-composer">
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="What’s going on?"
              placeholderTextColor={Colors.light.textSecondary}
              style={styles.input}
              multiline
              maxLength={600}
              testID="kora-input"
            />

            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
              ]}
              onPress={toggleRecording}
              disabled={isSending || isTranscribing}
              activeOpacity={0.85}
              testID="kora-mic"
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isTranscribing ? (
                <ActivityIndicator color={Colors.light.primary} size="small" />
              ) : isRecording ? (
                <MicOff size={18} color={Colors.light.card} />
              ) : (
                <Mic size={18} color={Colors.light.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={() => void send(input)}
              disabled={!input.trim() || isSending}
              activeOpacity={0.85}
              testID="kora-send"
              accessibilityLabel="Send message"
            >
              {isSending ? (
                <ActivityIndicator color={Colors.light.card} size="small" />
              ) : (
                <Send size={18} color={Colors.light.card} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer} testID="kora-disclaimer">
            Kora is supportive, not a substitute for professional care.
          </Text>
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
  bgOrbs: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.22,
  },
  orb1: {
    width: 260,
    height: 260,
    backgroundColor: '#FFD9C9',
    top: -90,
    left: -80,
  },
  orb2: {
    width: 220,
    height: 220,
    backgroundColor: '#FFF3B0',
    top: 120,
    right: -110,
  },
  orb3: {
    width: 300,
    height: 300,
    backgroundColor: '#E7D9FF',
    bottom: -160,
    left: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  koraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  koraDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  koraBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.text,
  },
  koraBadgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.light.border,
    opacity: 0.8,
  },
  koraBadgeSub: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  welcomeCard: {
    marginTop: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  sparkleBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  welcomeText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  quickChip: {
    backgroundColor: '#FFF0ED',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  errorCard: {
    marginTop: 12,
    backgroundColor: '#FFF2F2',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B42318',
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#7A271A',
    lineHeight: 18,
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
    marginBottom: 10,
    flexDirection: 'row',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  koraBubble: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.35)',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
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
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  composerWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  disclaimer: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
