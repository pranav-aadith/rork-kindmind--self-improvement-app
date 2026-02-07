import { Clock, Calendar, Search, ChevronRight, BookOpen } from 'lucide-react-native';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import type { JournalEntry } from '@/types';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getRelativeDate = (timestamp: number): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface GroupedEntries {
  date: string;
  entries: JournalEntry[];
}

export default function HistoryScreen() {
  const { data } = useKindMind();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return data.journalEntries;
    
    const query = searchQuery.toLowerCase();
    return data.journalEntries.filter(entry =>
      entry.gratitude.toLowerCase().includes(query) ||
      entry.reflection.toLowerCase().includes(query) ||
      entry.emotion.toLowerCase().includes(query)
    );
  }, [data.journalEntries, searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const dateKey = new Date(entry.timestamp).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return Object.entries(groups)
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => b.timestamp - a.timestamp),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredEntries]);

  const openEntryDetail = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowDetail(true);
  };

  const totalEntries = data.journalEntries.length;
  const uniqueDays = new Set(data.journalEntries.map(e => new Date(e.timestamp).toDateString())).size;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Journal History</Text>
          <Text style={styles.subtitle}>All your reflections in one place</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <BookOpen size={16} color={Colors.light.primary} />
            <Text style={styles.statPillText}>{totalEntries} entries</Text>
          </View>
          <View style={styles.statPill}>
            <Calendar size={16} color={Colors.light.secondary} />
            <Text style={styles.statPillText}>{uniqueDays} days</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Clock size={48} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No entries found' : 'No journal entries yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start journaling to see your history here'}
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.entriesList}
            contentContainerStyle={styles.entriesContent}
            showsVerticalScrollIndicator={false}
          >
            {groupedEntries.map((group, groupIndex) => (
              <View key={group.date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>
                    {getRelativeDate(group.entries[0].timestamp)}
                  </Text>
                  <Text style={styles.dateSubtext}>
                    {new Date(group.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                
                {group.entries.map((entry, index) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.entryCard,
                      index === group.entries.length - 1 && styles.lastEntryCard,
                    ]}
                    onPress={() => openEntryDetail(entry)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.entryLeft}>
                      <Text style={styles.entryEmoji}>{entry.emotionEmoji}</Text>
                    </View>
                    <View style={styles.entryContent}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryEmotion}>{entry.emotion}</Text>
                        <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
                      </View>
                      <Text style={styles.entryPreview} numberOfLines={2}>
                        {entry.gratitude || entry.reflection}
                      </Text>
                    </View>
                    <View style={styles.entryArrow}>
                      <ChevronRight size={20} color={Colors.light.textSecondary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </Animated.View>

      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {selectedEntry && (
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowDetail(false)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Entry Details</Text>
                <View style={styles.modalCloseBtn} />
              </View>

              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
              >
                <View style={styles.detailHeader}>
                  <View style={styles.detailEmojiContainer}>
                    <Text style={styles.detailEmoji}>{selectedEntry.emotionEmoji}</Text>
                  </View>
                  <Text style={styles.detailEmotion}>{selectedEntry.emotion}</Text>
                  <Text style={styles.detailDate}>
                    {formatDate(selectedEntry.timestamp)}
                  </Text>
                  <Text style={styles.detailTime}>
                    {formatTime(selectedEntry.timestamp)}
                  </Text>
                </View>

                {!!selectedEntry.gratitude && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Gratitude</Text>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>{selectedEntry.gratitude}</Text>
                    </View>
                  </View>
                )}

                {!!selectedEntry.reflection && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Reflection</Text>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>{selectedEntry.reflection}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  statPillText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  entriesList: {
    flex: 1,
  },
  entriesContent: {
    paddingHorizontal: 24,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  dateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  lastEntryCard: {
    marginBottom: 0,
  },
  entryLeft: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryEmoji: {
    fontSize: 24,
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryEmotion: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  entryTime: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  entryPreview: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  entryArrow: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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
    width: 60,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.secondary,
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
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    color: Colors.light.text,
    marginBottom: 4,
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
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
  },
  detailText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 26,
  },
});
