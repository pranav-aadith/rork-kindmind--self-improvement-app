import { router } from 'expo-router';
import { Heart, BookOpen, Flower, CheckCircle2, BarChart3, Sparkles, Timer } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import { getDailyQuote } from '@/constants/quotes';

export default function HomeScreen() {
  const { data, hasCheckedInToday } = useKindMind();
  const dailyQuote = getDailyQuote();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;

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

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const animateButtonPress = (callback: () => void) => {
    callback();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Animated.View style={[styles.headerTop, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={styles.greeting}>Hello {data.username || 'there'}</Text>
              <Text style={styles.subtitle}>How are you feeling today?</Text>
            </View>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: heartScale }] }]}>
              <Heart size={32} color={Colors.light.primary} fill={Colors.light.primary} />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.quoteCard, { opacity: quoteAnim, transform: [{ scale: quoteAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
          <View style={styles.quoteIconContainer}>
            <Sparkles size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.quoteText}>{dailyQuote}</Text>
        </Animated.View>

        {!hasCheckedInToday && (
          <TouchableOpacity
            style={styles.checkInBanner}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.8}
          >
            <View style={styles.bannerIcon}>
              <CheckCircle2 size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Daily Check-In</Text>
              <Text style={styles.bannerText}>Reflect on today</Text>
            </View>
            <View style={styles.bannerArrow}>
              <Text style={styles.bannerArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        <Animated.View style={[styles.statsGrid, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Flower size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.statNumber}>{data.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          <Animated.View style={{ opacity: card1Anim, transform: [{ scale: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardPrimary]}
              onPress={() => animateButtonPress(() => router.push('/trigger'))}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIcon, styles.actionIconPrimary]}>
                <BookOpen size={28} color={Colors.light.card} />
              </View>
              <Text style={styles.actionTitle}>Journal</Text>
              <Text style={styles.actionDescription}>
                Reflect on your day and emotions
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: card2Anim, transform: [{ scale: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardSecondary]}
              onPress={() => animateButtonPress(() => router.push('/pause'))}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIcon, styles.actionIconSecondary]}>
                <Heart size={28} color={Colors.light.card} />
              </View>
              <Text style={styles.actionTitle}>Pause Practice</Text>
              <Text style={styles.actionDescription}>
                Take a mindful moment to breathe
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: card3Anim, transform: [{ scale: card3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardMeditation]}
              onPress={() => animateButtonPress(() => router.push('/meditation'))}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIcon, styles.actionIconMeditation]}>
                <Timer size={28} color={Colors.light.card} />
              </View>
              <Text style={styles.actionTitle}>Meditation Timer</Text>
              <Text style={styles.actionDescription}>
                Set a timer for mindful meditation
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
          activeOpacity={0.8}
        >
          <View style={styles.analyticsIcon}>
            <BarChart3 size={24} color={Colors.light.primary} />
          </View>
          <View style={styles.analyticsContent}>
            <Text style={styles.analyticsTitle}>View Analytics</Text>
            <Text style={styles.analyticsText}>
              Track your emotional patterns
            </Text>
          </View>
        </TouchableOpacity>

        {data.journalEntries && data.journalEntries.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              <TouchableOpacity onPress={() => router.push('/progress')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.triggersContainer}>
              {data.journalEntries.slice(0, 3).map(entry => (
                <View key={entry.id} style={styles.triggerCard}>
                  <View style={styles.triggerHeader}>
                    <Text style={styles.journalEmoji}>{entry.emotionEmoji} {entry.emotion}</Text>
                    <Text style={styles.triggerTime}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.triggerSituation} numberOfLines={2}>
                    {entry.gratitude}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  checkInBanner: {
    backgroundColor: '#FFF0ED',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
    marginLeft: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  bannerArrow: {
    marginLeft: 12,
  },
  bannerArrowText: {
    fontSize: 24,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionLink: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionCardPrimary: {
    backgroundColor: Colors.light.primary,
  },
  actionCardSecondary: {
    backgroundColor: Colors.light.secondary,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIconPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionIconSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionCardMeditation: {
    backgroundColor: '#6366F1',
  },
  actionIconMeditation: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.card,
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 15,
    color: Colors.light.card,
    opacity: 0.9,
    lineHeight: 22,
  },
  goalsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  triggersContainer: {
    gap: 12,
    marginBottom: 32,
  },
  triggerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  triggerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  triggerEmotion: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  triggerIntensity: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  triggerSituation: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  triggerTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  journalEmoji: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  bottomSpacer: {
    height: 40,
  },
  quoteCard: {
    backgroundColor: '#FFF9F5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteIconContainer: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.light.text,
    fontWeight: '500',
    fontStyle: 'italic' as const,
  },
  analyticsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
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
  analyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsContent: {
    flex: 1,
    marginLeft: 16,
  },
  analyticsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  analyticsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
