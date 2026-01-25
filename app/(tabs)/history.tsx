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
  
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>
            {data.journalEntries.length} {data.journalEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </Animated.View>

        {data.journalEntries.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIcon}>
              <Calendar size={32} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyText}>Start journaling to see your entries here</Text>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {monthKeys.map((month) => (
              <View key={month} style={styles.monthSection}>
                <Text style={styles.monthLabel}>{month}</Text>
                <View style={styles.entriesCard}>
                  {groupedEntries[month].map((entry, index) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={[
                        styles.entryRow,
                        index < groupedEntries[month].length - 1 && styles.entryRowBorder,
                      ]}
                      onPress={() => openEntryDetail(entry)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.entryLeft}>
                        <Text style={styles.entryEmoji}>{entry.emotionEmoji}</Text>
                        <View style={styles.entryInfo}>
                          <Text style={styles.entryEmotion}>{entry.emotion}</Text>
                          <Text style={styles.entryTime}>
                            {formatShortDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Entry</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            {selectedEntry && (
              <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailEmoji}>{selectedEntry.emotionEmoji}</Text>
                  <Text style={styles.detailEmotion}>{selectedEntry.emotion}</Text>
                  <Text style={styles.detailDate}>{formatDate(selectedEntry.timestamp)}</Text>
                </View>

                {selectedEntry.gratitude && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Grateful For</Text>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>{selectedEntry.gratitude}</Text>
                    </View>
                  </View>
                )}

                {selectedEntry.reflection && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Reflection</Text>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>{selectedEntry.reflection}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  monthSection: {
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  entriesCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  entryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryEmotion: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
    fontSize: 17,
    fontWeight: '600',
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
    marginBottom: 28,
  },
  detailEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  detailEmotion: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  detailDate: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  detailText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 23,
  },
});
