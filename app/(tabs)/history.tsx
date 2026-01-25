import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { Calendar, X, ChevronRight } from 'lucide-react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import type { JournalEntry } from '@/types';

export default function HistoryScreen() {
  const { data } = useKindMind();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
  }, []);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const openEntryDetail = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedEntry(null);
  };

  const groupEntriesByMonth = () => {
    const groups: { [key: string]: JournalEntry[] } = {};
    
    data.journalEntries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(entry);
    });
    
    return groups;
  };

  const groupedEntries = groupEntriesByMonth();
  const monthKeys = Object.keys(groupedEntries);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Journal History</Text>
          <Text style={styles.subtitle}>
            {data.journalEntries.length} {data.journalEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </Animated.View>

        {data.journalEntries.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIcon}>
              <Calendar size={48} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyText}>
              Start journaling to see your entries here
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {monthKeys.map((month, monthIndex) => (
              <View key={month} style={styles.monthSection}>
                <Text style={styles.monthHeader}>{month}</Text>
                <View style={styles.entriesContainer}>
                  {groupedEntries[month].map((entry, index) => (
                    <Animated.View
                      key={entry.id}
                      style={{
                        opacity: fadeAnim,
                        transform: [{
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20 * (index + 1), 0],
                          }),
                        }],
                      }}
                    >
                      <TouchableOpacity
                        style={styles.entryCard}
                        onPress={() => openEntryDetail(entry)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.entryHeader}>
                          <View style={styles.entryEmoji}>
                            <Text style={styles.emojiText}>{entry.emotionEmoji}</Text>
                          </View>
                          <View style={styles.entryMeta}>
                            <Text style={styles.entryEmotion}>{entry.emotion}</Text>
                            <Text style={styles.entryDate}>
                              {formatShortDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                            </Text>
                          </View>
                          <ChevronRight size={20} color={Colors.light.textSecondary} />
                        </View>
                        
                        {entry.gratitude && (
                          <View style={styles.entryContent}>
                            <Text style={styles.entryLabel}>Grateful for</Text>
                            <Text style={styles.entryText} numberOfLines={2}>
                              {entry.gratitude}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetailModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeDetailModal} style={styles.modalCloseBtn}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Journal Entry</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            {selectedEntry && (
              <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailEmojiContainer}>
                    <Text style={styles.detailEmoji}>{selectedEntry.emotionEmoji}</Text>
                  </View>
                  <Text style={styles.detailEmotion}>{selectedEntry.emotion}</Text>
                  <Text style={styles.detailDate}>{formatDate(selectedEntry.timestamp)}</Text>
                  <Text style={styles.detailTime}>{formatTime(selectedEntry.timestamp)}</Text>
                </View>

                {selectedEntry.gratitude && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Grateful For</Text>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardText}>{selectedEntry.gratitude}</Text>
                    </View>
                  </View>
                )}

                {selectedEntry.reflection && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Reflection</Text>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardText}>{selectedEntry.reflection}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
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
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  entriesContainer: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  entryMeta: {
    flex: 1,
    marginLeft: 12,
  },
  entryEmotion: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  entryContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  entryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  entryText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
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
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  detailEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  detailEmoji: {
    fontSize: 40,
  },
  detailEmotion: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  detailDate: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  detailTime: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  detailCardText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 26,
  },
});
