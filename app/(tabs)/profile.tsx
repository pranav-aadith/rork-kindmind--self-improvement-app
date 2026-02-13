import { User, Heart, Award, Calendar, Target, Edit3, LogOut, Shield, Info, ChevronRight, FileText, Moon, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function ProfileScreen() {
  const { data, updateUsername } = useKindMind();
  const { signOut, user } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(data.username || '');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const handleSaveUsername = () => {
    const trimmed = (tempUsername || '').trim();
    if (trimmed.length > 0) {
      updateUsername(trimmed);
      setIsEditingUsername(false);
    }
  };

  const handleCancelEdit = () => {
    setTempUsername(data.username || '');
    setIsEditingUsername(false);
  };

  const joinedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your KindMind journey</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.subtle }]}>
            <User size={48} color={colors.primary} />
          </View>
          
          <View style={styles.usernameContainer}>
            <Text style={[styles.username, { color: colors.text }]}>{data.username || user?.user_metadata?.full_name || 'User'}</Text>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.subtle }]}
              onPress={() => setIsEditingUsername(true)}
              activeOpacity={0.7}
            >
              <Edit3 size={16} color={colors.primary} />
              <Text style={[styles.editButtonText, { color: colors.textSecondary }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.joinedContainer}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={[styles.joinedText, { color: colors.textSecondary }]}>Joined {joinedDate}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: theme === 'light' ? '#F0E8F5' : '#3A3448' }]}>
              <Heart size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{data.triggers.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Triggers Logged</Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: theme === 'light' ? '#E3F2EF' : '#2C3E3B' }]}>
              <Target size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{data.checkIns.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Check-Ins</Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.subtle }]}>
              <Award size={24} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{data.longestStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Longest Streak</Text>
          </View>
        </View>

        {data.goals.filter(g => g.selected).length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Goals</Text>
            </View>

            <View style={[styles.goalsContainer, { backgroundColor: colors.card }]}>
              {data.goals
                .filter(g => g.selected)
                .map(goal => (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={[styles.goalIcon, { backgroundColor: colors.subtle }]}>
                      <Target size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.goalText, { color: colors.text }]}>{goal.label}</Text>
                  </View>
                ))}
            </View>
          </>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.subtle }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About KindMind</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            KindMind is your personal tool for building emotional awareness and kinder communication. 
            Track your triggers, practice mindful responses, and watch your progress grow.
          </Text>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme === 'light' ? '#F5EFE8' : colors.subtle }]}>
                {theme === 'light' ? (
                  <Moon size={20} color={colors.accent} />
                ) : (
                  <Sun size={20} color={colors.secondary} />
                )}
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => setShowTermsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme === 'light' ? '#F0E8F5' : '#3A3448' }]}>
                <FileText size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => setShowPrivacyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme === 'light' ? '#E3F2EF' : '#2C3E3B' }]}>
                <Shield size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => setShowVersionModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.subtle }]}>
                <Info size={20} color={colors.accent} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Version</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutButtonText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={[styles.fullModalOverlay, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.fullModalSafeArea}>
            <View style={styles.fullModalHeader}>
              <Text style={styles.fullModalTitle}>Terms of Service</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTermsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.fullModalScroll} contentContainerStyle={styles.fullModalContent}>
              <Text style={styles.privacyText}>
                Last updated: February 2026
              </Text>
              <Text style={styles.privacyIntro}>
                Welcome to KindMind. By using our app, you agree to the following terms. Please read them carefully.
              </Text>

              <Text style={styles.privacyHeading}>1. Acceptance of Terms</Text>
              <Text style={styles.privacyText}>
                By creating an account, completing onboarding, or using any feature of KindMind, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.
              </Text>

              <Text style={styles.privacyHeading}>2. Account Registration</Text>
              <Text style={styles.privacyText}>
                You must create an account using a valid email address and password. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
              </Text>

              <Text style={styles.privacyHeading}>3. Onboarding & Personalization</Text>
              <Text style={styles.privacyText}>
                During onboarding, you may provide personal preferences including your reaction speed, common triggers, relationship impact, awareness level, and conflict frequency. This information is used solely to personalize your in-app experience and tailor features like Kora (AI coach) responses.
              </Text>

              <Text style={styles.privacyHeading}>4. Journaling Feature</Text>
              <Text style={styles.privacyText}>
                The Journal allows you to record gratitude entries, reflections, and emotions. AI-generated writing prompts are available to inspire your entries. All journal content is stored locally on your device and is never shared with third parties.
              </Text>

              <Text style={styles.privacyHeading}>5. Kora AI Coach</Text>
              <Text style={styles.privacyText}>
                Kora is an AI-powered kindness coach that provides supportive, non-judgmental responses based on your messages and onboarding profile. Important limitations:
              </Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Kora is not a licensed therapist, counselor, or medical professional</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Kora does not diagnose mental health conditions</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Responses are informational and supportive in nature only</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} If you are in crisis, please contact a mental health professional or emergency services</Text>

              <Text style={styles.privacyHeading}>6. Voice Input & Transcription</Text>
              <Text style={styles.privacyText}>
                You may use voice input to interact with Kora or the Journal. Audio recordings are temporarily processed for transcription and are not stored permanently. Microphone access requires your explicit permission.
              </Text>

              <Text style={styles.privacyHeading}>7. Daily Check-Ins</Text>
              <Text style={styles.privacyText}>
                Daily check-ins track behavioral patterns such as reacting calmly, avoiding snapping, being kinder, positive self-talk, and feeling relaxed. This data is stored locally and used to calculate your streaks and progress analytics.
              </Text>

              <Text style={styles.privacyHeading}>8. Trigger Logging</Text>
              <Text style={styles.privacyText}>
                The Trigger feature allows you to log emotional triggers including the situation, your reaction, the emotion felt, and its intensity. This information is used to help you identify patterns and is stored locally on your device.
              </Text>

              <Text style={styles.privacyHeading}>9. Pause & Breathing Exercises</Text>
              <Text style={styles.privacyText}>
                The Pause feature provides guided breathing exercises with optional haptic feedback. This feature is designed for relaxation and mindfulness and is not a substitute for professional therapeutic techniques.
              </Text>

              <Text style={styles.privacyHeading}>10. Meditation Timer</Text>
              <Text style={styles.privacyText}>
                The Meditation feature provides a customizable timer with preset durations and optional completion sounds. Session data is not tracked or stored beyond the current session.
              </Text>

              <Text style={styles.privacyHeading}>11. Progress & Analytics</Text>
              <Text style={styles.privacyText}>
                KindMind provides progress tracking including streak counts, emotion trends, check-in history, and success rates. All analytics are generated from your locally stored data and are visible only to you.
              </Text>

              <Text style={styles.privacyHeading}>12. User-Generated Content</Text>
              <Text style={styles.privacyText}>
                All content you create (journal entries, trigger logs, check-ins) belongs to you. We do not claim ownership of your personal entries. You may delete your data at any time.
              </Text>

              <Text style={styles.privacyHeading}>13. Prohibited Use</Text>
              <Text style={styles.privacyText}>
                You agree not to:
              </Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Use KindMind for any unlawful purpose</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Attempt to reverse-engineer, hack, or disrupt the app</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Misuse the Kora AI feature to generate harmful or abusive content</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Share your account credentials with others</Text>

              <Text style={styles.privacyHeading}>14. Disclaimer of Warranties</Text>
              <Text style={styles.privacyText}>
                KindMind is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the app will be error-free, uninterrupted, or that AI-generated content will always be accurate or appropriate.
              </Text>

              <Text style={styles.privacyHeading}>15. Limitation of Liability</Text>
              <Text style={styles.privacyText}>
                KindMind and its creators shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the app, including but not limited to reliance on AI-generated advice.
              </Text>

              <Text style={styles.privacyHeading}>16. Changes to Terms</Text>
              <Text style={styles.privacyText}>
                We reserve the right to modify these terms at any time. Continued use of KindMind after changes are posted constitutes your acceptance of the updated terms.
              </Text>

              <Text style={styles.privacyHeading}>17. Contact</Text>
              <Text style={styles.privacyText}>
                If you have questions about these Terms of Service, please reach out through the app or our support channels.
              </Text>

              <View style={styles.privacyBottomSpacer} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={[styles.fullModalOverlay, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.fullModalSafeArea}>
            <View style={styles.fullModalHeader}>
              <Text style={styles.fullModalTitle}>Privacy Policy</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPrivacyModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.fullModalScroll} contentContainerStyle={styles.fullModalContent}>
              <Text style={styles.privacyText}>
                Last updated: February 2026
              </Text>
              <Text style={styles.privacyIntro}>
                Your emotional well-being is deeply personal. This Privacy Policy explains what data KindMind collects, how it is used, and your rights regarding that data.
              </Text>

              <Text style={styles.privacyHeading}>1. Information We Collect</Text>
              <Text style={styles.privacyText}>
                We collect only what is necessary to provide and personalize your KindMind experience:
              </Text>

              <Text style={styles.privacySectionLabel}>Account Information</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Email address and password (managed securely via Supabase authentication)</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Display name (optional, editable in your profile)</Text>

              <Text style={styles.privacySectionLabel}>Onboarding Data</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Reaction speed, common triggers, relationship impact, awareness level, and conflict frequency</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Personal goals you select (e.g., &quot;I want to be calmer&quot;)</Text>

              <Text style={styles.privacySectionLabel}>Journal Entries</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Gratitude entries, reflections, and selected emotions/emojis</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} AI-generated writing prompts (generated on-device, not stored on servers)</Text>

              <Text style={styles.privacySectionLabel}>Kora AI Conversations</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Text and voice messages you send to Kora</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Conversations are session-based and not permanently stored on our servers</Text>

              <Text style={styles.privacySectionLabel}>Daily Check-Ins</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Behavioral responses: reacted calmly, avoided snapping, was kinder, positive self-talk, felt relaxed</Text>

              <Text style={styles.privacySectionLabel}>Trigger Logs</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Situation descriptions, reactions, emotions, and intensity levels</Text>

              <Text style={styles.privacySectionLabel}>Usage Analytics</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Streak data, check-in frequency, and progress metrics (calculated locally)</Text>

              <Text style={styles.privacyHeading}>2. Information We Do NOT Collect</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} We do not permanently store audio recordings (voice input is transcribed and discarded)</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} We do not access your contacts, photos, files, or camera</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} We do not collect precise location data</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} We do not track you across other apps or websites</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} We do not collect social media information</Text>

              <Text style={styles.privacyHeading}>3. How Your Data Is Used</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Personalize Kora AI responses using your onboarding profile</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Display your progress analytics, streaks, and emotion trends</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Generate AI journal prompts tailored to emotional wellness</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Calculate daily check-in success rates and streaks</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Provide breathing exercise and meditation features</Text>
              <Text style={styles.privacyText}>
                Your data is never sold, rented, or shared with third parties for advertising purposes.
              </Text>

              <Text style={styles.privacyHeading}>4. Data Storage & Security</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Personal data (journal entries, check-ins, triggers, goals) is stored locally on your device using encrypted storage</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Authentication is handled securely through Supabase with industry-standard encryption</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Voice recordings are transmitted securely for transcription and immediately discarded after processing</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Kora AI conversations are processed in real-time and are not stored on external servers after your session ends</Text>

              <Text style={styles.privacyHeading}>5. Voice & Microphone Usage</Text>
              <Text style={styles.privacyText}>
                KindMind requests microphone access only when you choose to use voice input with Kora or the Journal. Audio is:
              </Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Recorded temporarily for speech-to-text transcription</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Sent to a secure transcription service for processing</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Not stored permanently on any server</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} You can revoke microphone access at any time in your device settings</Text>

              <Text style={styles.privacyHeading}>6. AI-Generated Content</Text>
              <Text style={styles.privacyText}>
                KindMind uses AI for Kora coaching and journal prompt generation:
              </Text>
              <Text style={styles.privacyBullet}>{'\u2022'} AI responses are generated based on your messages and onboarding profile</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} AI does not have access to data beyond what you provide in the current session</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} AI-generated content is for informational and emotional support only, not clinical advice</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Journal prompts are generated from a diverse set of wellness-focused categories</Text>

              <Text style={styles.privacyHeading}>7. Haptics & Device Features</Text>
              <Text style={styles.privacyText}>
                The Pause (breathing) feature and Meditation timer may use haptic feedback on supported devices. No data is collected from these interactions.
              </Text>

              <Text style={styles.privacyHeading}>8. Your Rights & Control</Text>
              <Text style={styles.privacyText}>
                You have full control over your data:
              </Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Edit or delete journal entries, trigger logs, and check-ins at any time</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Update your username, goals, and profile information</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Log out and clear your session at any time</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Request deletion of your account and all associated data</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Revoke microphone permissions through your device settings</Text>

              <Text style={styles.privacyHeading}>9. Children&apos;s Privacy</Text>
              <Text style={styles.privacyText}>
                KindMind is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with data, please contact us to have it removed.
              </Text>

              <Text style={styles.privacyHeading}>10. Third-Party Services</Text>
              <Text style={styles.privacyText}>
                KindMind uses the following third-party services:
              </Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Supabase for secure authentication</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} Speech-to-text transcription service for voice input</Text>
              <Text style={styles.privacyBullet}>{'\u2022'} AI model provider for Kora responses and journal prompts</Text>
              <Text style={styles.privacyText}>
                These services are bound by their own privacy policies and are selected for their commitment to data security.
              </Text>

              <Text style={styles.privacyHeading}>11. Changes to This Policy</Text>
              <Text style={styles.privacyText}>
                We may update this Privacy Policy as KindMind evolves. Significant changes will be communicated through the app. Continued use after updates constitutes acceptance of the revised policy.
              </Text>

              <Text style={styles.privacyHeading}>12. Contact Us</Text>
              <Text style={styles.privacyText}>
                If you have any questions, concerns, or requests regarding your privacy, please reach out through the app or our support channels.
              </Text>

              <View style={styles.privacyBottomSpacer} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showVersionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVersionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.versionModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.versionIconContainer, { backgroundColor: colors.subtle }]}>
              <Info size={32} color={colors.primary} />
            </View>
            <Text style={[styles.versionTitle, { color: colors.text }]}>KindMind</Text>
            <Text style={[styles.versionNumber, { color: colors.secondary }]}>Version 1</Text>
            <Text style={[styles.versionDescription, { color: colors.textSecondary }]}>
              Your personal tool for building emotional awareness and kinder communication.
            </Text>
            <TouchableOpacity
              style={[styles.versionCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowVersionModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.versionCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditingUsername}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Username</Text>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={tempUsername}
              onChangeText={setTempUsername}
              placeholder="Enter username"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  (tempUsername || '').trim().length === 0 && { backgroundColor: colors.border },
                ]}
                onPress={handleSaveUsername}
                disabled={(tempUsername || '').trim().length === 0}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  username: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinedText: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  goalsContainer: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    gap: 14,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  infoCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 17,
    borderWidth: 2,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  saveButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  menuSection: {
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },
  fullModalOverlay: {
    flex: 1,
  },
  fullModalSafeArea: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  fullModalScroll: {
    flex: 1,
  },
  fullModalContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  privacyIntro: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  privacyHeading: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 24,
    marginBottom: 12,
  },
  privacySectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  privacyBullet: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
  privacyBottomSpacer: {
    height: 40,
  },
  versionModalContent: {
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  versionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  versionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  versionNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  versionDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  versionCloseButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  versionCloseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
