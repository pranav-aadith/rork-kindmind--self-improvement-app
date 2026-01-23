import { User, Heart, Award, Calendar, Target, Edit3, LogOut, Shield, Info, ChevronRight } from 'lucide-react-native';
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
import Colors from '@/constants/colors';

export default function ProfileScreen() {
  const { data, updateUsername, logout } = useKindMind();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(data.username || '');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your KindMind journey</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User size={48} color={Colors.light.primary} />
          </View>
          
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{data.username || 'User'}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditingUsername(true)}
              activeOpacity={0.7}
            >
              <Edit3 size={16} color={Colors.light.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.joinedContainer}>
            <Calendar size={16} color={Colors.light.textSecondary} />
            <Text style={styles.joinedText}>Joined {joinedDate}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF0ED' }]}>
              <Heart size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.statNumber}>{data.triggers.length}</Text>
            <Text style={styles.statLabel}>Triggers Logged</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5F0' }]}>
              <Target size={24} color={Colors.light.secondary} />
            </View>
            <Text style={styles.statNumber}>{data.checkIns.length}</Text>
            <Text style={styles.statLabel}>Check-Ins</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF4E8' }]}>
              <Award size={24} color={Colors.light.accent} />
            </View>
            <Text style={styles.statNumber}>{data.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
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
                    <View style={styles.goalIcon}>
                      <Target size={20} color={Colors.light.primary} />
                    </View>
                    <Text style={styles.goalText}>{goal.label}</Text>
                  </View>
                ))}
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About KindMind</Text>
          <Text style={styles.infoText}>
            KindMind is your personal tool for building emotional awareness and kinder communication. 
            Track your triggers, practice mindful responses, and watch your progress grow.
          </Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPrivacyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5F0' }]}>
                <Shield size={20} color={Colors.light.secondary} />
              </View>
              <Text style={styles.menuItemText}>Privacy & Data Protection</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowVersionModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF4E8' }]}>
                <Info size={20} color={Colors.light.accent} />
              </View>
              <Text style={styles.menuItemText}>Version</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.light.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.fullModalSafeArea}>
            <View style={styles.fullModalHeader}>
              <Text style={styles.fullModalTitle}>Privacy & Data Protection</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPrivacyModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.fullModalScroll} contentContainerStyle={styles.fullModalContent}>
              <Text style={styles.privacyIntro}>
                Your emotional well-being is personal. We are committed to protecting your privacy and being transparent about how your data is handled.
              </Text>

              <Text style={styles.privacyHeading}>What We Collect</Text>
              <Text style={styles.privacyText}>
                We only collect what&apos;s necessary to support your emotional awareness journey:
              </Text>
              <Text style={styles.privacyBullet}>• Check-in responses (yes/no answers, mood selections)</Text>
              <Text style={styles.privacyBullet}>• Optional notes or reflections you choose to add</Text>
              <Text style={styles.privacyBullet}>• App usage data (feature usage, crash reports) to improve performance</Text>

              <Text style={styles.privacyHeading}>What We Do NOT Collect</Text>
              <Text style={styles.privacyBullet}>• No audio or video recordings</Text>
              <Text style={styles.privacyBullet}>• No contacts, photos, or files</Text>
              <Text style={styles.privacyBullet}>• No precise location data</Text>
              <Text style={styles.privacyBullet}>• No social media data</Text>

              <Text style={styles.privacyHeading}>How Your Data Is Used</Text>
              <Text style={styles.privacyText}>Your data is used to:</Text>
              <Text style={styles.privacyBullet}>• Show personal insights, trends, and summaries</Text>
              <Text style={styles.privacyBullet}>• Personalize your experience</Text>
              <Text style={styles.privacyBullet}>• Improve app reliability and features</Text>
              <Text style={styles.privacyText}>
                Your data is never used for advertising or sold to third parties.
              </Text>

              <Text style={styles.privacyHeading}>Data Storage & Security</Text>
              <Text style={styles.privacyBullet}>• Data is stored securely using industry-standard encryption</Text>
              <Text style={styles.privacyBullet}>• Access is limited to essential systems only</Text>

              <Text style={styles.privacyHeading}>Your Control</Text>
              <Text style={styles.privacyText}>You are always in control of your data:</Text>
              <Text style={styles.privacyBullet}>• Edit or delete entries at any time</Text>
              <Text style={styles.privacyBullet}>• Export your data (if enabled)</Text>
              <Text style={styles.privacyBullet}>• Delete your account and all associated data</Text>

              <Text style={styles.privacyHeading}>AI & Insights</Text>
              <Text style={styles.privacyText}>If the app provides AI-generated insights:</Text>
              <Text style={styles.privacyBullet}>• Insights are informational, not medical advice</Text>
              <Text style={styles.privacyBullet}>• AI does not diagnose conditions</Text>
              <Text style={styles.privacyBullet}>• Data used for insights is handled securely</Text>

              <Text style={styles.privacyHeading}>Changes to This Privacy Screen</Text>
              <Text style={styles.privacyText}>
                We may update this screen as the app evolves. Significant changes will be clearly communicated.
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
          <View style={styles.versionModalContent}>
            <View style={styles.versionIconContainer}>
              <Info size={32} color={Colors.light.primary} />
            </View>
            <Text style={styles.versionTitle}>KindMind</Text>
            <Text style={styles.versionNumber}>Version 1</Text>
            <Text style={styles.versionDescription}>
              Your personal tool for building emotional awareness and kinder communication.
            </Text>
            <TouchableOpacity
              style={styles.versionCloseButton}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Username</Text>
            </View>

            <TextInput
              style={styles.input}
              value={tempUsername}
              onChangeText={setTempUsername}
              placeholder="Enter username"
              placeholderTextColor={Colors.light.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (tempUsername || '').trim().length === 0 && styles.saveButtonDisabled,
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  profileCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 32,
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
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF0ED',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinedText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  goalsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFF0ED',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.light.text,
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
    backgroundColor: Colors.light.card,
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
    fontWeight: '700',
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 17,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.light.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.card,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.error + '40',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.error,
  },
  menuSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.card,
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
    color: Colors.light.text,
    marginBottom: 24,
  },
  privacyHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 24,
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: 12,
  },
  privacyBullet: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: 8,
    paddingLeft: 8,
  },
  privacyBottomSpacer: {
    height: 40,
  },
  versionModalContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  versionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  versionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  versionNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 16,
  },
  versionDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  versionCloseButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  versionCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.card,
  },
});
