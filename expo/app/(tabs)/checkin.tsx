import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';

export default function CheckInScreen() {
  const { addCheckIn } = useKindMind();
  const [reactedCalmly, setReactedCalmly] = useState(false);
  const [avoidedSnapping, setAvoidedSnapping] = useState(false);
  const [wasKinder, setWasKinder] = useState(false);
  const [noticedPositiveSelfTalk, setNoticedPositiveSelfTalk] = useState(false);
  const [feltRelaxed, setFeltRelaxed] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const card4Anim = useRef(new Animated.Value(0)).current;
  const card5Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const checkboxAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(100, [
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(card1Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.spring(card2Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(card3Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(card4Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(card5Anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateCheckbox = (index: number) => {
    Animated.sequence([
      Animated.timing(checkboxAnims[index], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(checkboxAnims[index], {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = () => {
    animateButtonPress();
    setTimeout(() => {
      addCheckIn({ 
        reactedCalmly, 
        avoidedSnapping, 
        wasKinder,
        noticedPositiveSelfTalk,
        feltRelaxed,
      });
      router.back();
    }, 200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check-In</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
            <CheckCircle2 size={64} color={Colors.light.primary} />
          </Animated.View>
          
          <Animated.View style={{ opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <Text style={styles.title}>How did today go?</Text>
            <Text style={styles.subtitle}>
              Reflect on your behavior and progress today
            </Text>
          </Animated.View>

          <View style={styles.questions}>
            <Animated.View style={{ opacity: card1Anim, transform: [{ translateX: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
              <TouchableOpacity
                style={[styles.questionCard, reactedCalmly && styles.questionCardSelected]}
                onPress={() => { animateCheckbox(0); setReactedCalmly(!reactedCalmly); }}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.checkbox, reactedCalmly && styles.checkboxSelected, { transform: [{ scale: checkboxAnims[0] }] }]}>
                  {reactedCalmly && <View style={styles.checkboxInner} />}
                </Animated.View>
                <View style={styles.questionContent}>
                  <Text style={[styles.questionTitle, reactedCalmly && styles.questionTitleSelected]}>
                    Did you react calmly today?
                  </Text>
                  <Text style={styles.questionSubtitle}>
                    Even in challenging moments
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: card2Anim, transform: [{ translateX: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
              <TouchableOpacity
                style={[styles.questionCard, avoidedSnapping && styles.questionCardSelected]}
                onPress={() => { animateCheckbox(1); setAvoidedSnapping(!avoidedSnapping); }}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.checkbox, avoidedSnapping && styles.checkboxSelected, { transform: [{ scale: checkboxAnims[1] }] }]}>
                  {avoidedSnapping && <View style={styles.checkboxInner} />}
                </Animated.View>
                <View style={styles.questionContent}>
                  <Text style={[styles.questionTitle, avoidedSnapping && styles.questionTitleSelected]}>
                    Did you avoid snapping at someone?
                  </Text>
                  <Text style={styles.questionSubtitle}>
                    You paused before reacting
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: card3Anim, transform: [{ translateX: card3Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
              <TouchableOpacity
                style={[styles.questionCard, wasKinder && styles.questionCardSelected]}
                onPress={() => { animateCheckbox(2); setWasKinder(!wasKinder); }}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.checkbox, wasKinder && styles.checkboxSelected, { transform: [{ scale: checkboxAnims[2] }] }]}>
                  {wasKinder && <View style={styles.checkboxInner} />}
                </Animated.View>
                <View style={styles.questionContent}>
                  <Text style={[styles.questionTitle, wasKinder && styles.questionTitleSelected]}>
                    Were you kinder than yesterday?
                  </Text>
                  <Text style={styles.questionSubtitle}>
                    Small improvements matter
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: card4Anim, transform: [{ translateX: card4Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
              <TouchableOpacity
                style={[styles.questionCard, noticedPositiveSelfTalk && styles.questionCardSelected]}
                onPress={() => { animateCheckbox(3); setNoticedPositiveSelfTalk(!noticedPositiveSelfTalk); }}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.checkbox, noticedPositiveSelfTalk && styles.checkboxSelected, { transform: [{ scale: checkboxAnims[3] }] }]}>
                  {noticedPositiveSelfTalk && <View style={styles.checkboxInner} />}
                </Animated.View>
                <View style={styles.questionContent}>
                  <Text style={[styles.questionTitle, noticedPositiveSelfTalk && styles.questionTitleSelected]}>
                    Did you notice positive self-talk?
                  </Text>
                  <Text style={styles.questionSubtitle}>
                    Being kind to yourself counts
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: card5Anim, transform: [{ translateX: card5Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
              <TouchableOpacity
                style={[styles.questionCard, feltRelaxed && styles.questionCardSelected]}
                onPress={() => { animateCheckbox(4); setFeltRelaxed(!feltRelaxed); }}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.checkbox, feltRelaxed && styles.checkboxSelected, { transform: [{ scale: checkboxAnims[4] }] }]}>
                  {feltRelaxed && <View style={styles.checkboxInner} />}
                </Animated.View>
                <View style={styles.questionContent}>
                  <Text style={[styles.questionTitle, feltRelaxed && styles.questionTitleSelected]}>
                    Did you feel relaxed at any point today?
                  </Text>
                  <Text style={styles.questionSubtitle}>
                    Moments of peace are important
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View style={[styles.footer, { opacity: buttonAnim, transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Save Check-In</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  questions: {
    gap: 20,
    marginBottom: 40,
  },
  questionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#F0E8F5',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.light.card,
  },
  questionContent: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  questionTitleSelected: {
    fontWeight: '700',
  },
  questionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  footer: {
    paddingBottom: 20,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.card,
  },
});
