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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <User size={32} color={Colors.light.primary} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{data.username || 'User'}</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditingUsername(true)} activeOpacity={0.7}>
                <Edit3 size={14} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.joinedRow}>
              <Calendar size={12} color={Colors.light.textSecondary} />
              <Text style={styles.joinedText}>Joined {joinedDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Heart size={18} color={Colors.light.primary} />
            <Text style={styles.statValue}>{data.triggers.length}</Text>
            <Text style={styles.statLabel}>Triggers</Text>
          </View>
          <View style={styles.statBox}>
            <Target size={18} color={Colors.light.secondary} />
            <Text style={styles.statValue}>{data.checkIns.length}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statBox}>
            <Award size={18} color={Colors.light.accent} />
            <Text style={styles.statValue}>{data.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        {data.goals.filter(g => g.selected).length > 0 && (
          <View style={styles.section}>
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              KindMind helps you build emotional awareness and kinder communication through journaling and reflection.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={() => setShowPrivacyModal(true)} activeOpacity={0.6}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.light.secondary + '20' }]}>
                  <Shield size={16} color={Colors.light.secondary} />
                </View>
                <Text style={styles.menuText}>Privacy & Data</Text>
              </View>
              <ChevronRight size={18} color={Colors.light.textSecondary} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuRow} onPress={() => setShowVersionModal(true)} activeOpacity={0.6}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.light.accent + '20' }]}>
                  <Info size={16} color={Colors.light.accent} />
                </View>
                <Text style={styles.menuText}>Version</Text>
              </View>
              <ChevronRight size={18} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <LogOut size={18} color={Colors.light.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={showPrivacyModal} transparent animationType="slide" onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.fullModalSafeArea}>
            <View style={styles.fullModalHeader}>
              <Text style={styles.fullModalTitle}>Privacy & Data</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPrivacyModal(false)} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.fullModalScroll} contentContainerStyle={styles.fullModalContent}>
              <Text style={styles.privacyIntro}>
                Your emotional well-being is personal. We are committed to protecting your privacy.
              </Text>
              <Text style={styles.privacyHeading}>What We Collect</Text>
              <Text style={styles.privacyText}>Check-in responses, optional notes, and app usage data.</Text>
              <Text style={styles.privacyHeading}>What We Don't Collect</Text>
              <Text style={styles.privacyText}>No audio, video, contacts, photos, or precise location.</Text>
              <Text style={styles.privacyHeading}>Your Control</Text>
              <Text style={styles.privacyText}>Edit or delete entries anytime. Your data is never sold.</Text>
              <View style={styles.privacyBottomSpacer} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal visible={showVersionModal} transparent animationType="fade" onRequestClose={() => setShowVersionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.versionModal}>
            <View style={styles.versionIcon}>
              <Info size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.versionTitle}>KindMind</Text>
            <Text style={styles.versionNumber}>Version 1.0</Text>
            <TouchableOpacity style={styles.versionCloseBtn} onPress={() => setShowVersionModal(false)} activeOpacity={0.7}>
              <Text style={styles.versionCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditingUsername} transparent animationType="fade" onRequestClose={handleCancelEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Edit Username</Text>
            <TextInput
              style={styles.editInput}
              value={tempUsername}
              onChangeText={setTempUsername}
              placeholder="Enter username"
              placeholderTextColor={Colors.light.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              autoFocus
            />
            <View style={styles.editBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (tempUsername || '').trim().length === 0 && styles.saveBtnDisabled]}
                onPress={handleSaveUsername}
                disabled={(tempUsername || '').trim().length === 0}
                activeOpacity={0.7}
              >
                <Text style={styles.saveBtnText}>Save</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.light.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  joinedText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  goalsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
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
  aboutCard: {
    backgroundColor: Colors.light.primary + '12',
    borderRadius: 14,
    padding: 16,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 21,
  },
  menuCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 58,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.error + '30',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.error,
  },
  bottomSpacer: {
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  editModal: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  editInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  editBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.light.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.light.border,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.card,
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  fullModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.card,
  },
  fullModalScroll: {
    flex: 1,
  },
  fullModalContent: {
    padding: 20,
  },
  privacyIntro: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: 20,
  },
  privacyHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textSecondary,
  },
  privacyBottomSpacer: {
    height: 30,
  },
  versionModal: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  versionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  versionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.primary,
    marginBottom: 20,
  },
  versionCloseBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  versionCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
