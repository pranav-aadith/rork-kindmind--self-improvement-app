import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import {
  X,
  Smile,
  Flame,
  Wind,
  BarChart3,
  Sparkles,
  BookOpen,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { WidgetConfig, WidgetType } from '@/types';

const WIDGET_META: Record<WidgetType, { label: string; description: string; icon: React.ReactNode }> = {
  wellbeing: {
    label: 'Wellbeing Score',
    description: 'Your overall mental wellness trend',
    icon: <Sparkles size={20} color="#4CAF80" />,
  },
  streak: {
    label: 'Streak Counter',
    description: 'Track your daily check-in streak',
    icon: <Flame size={20} color="#FF6B35" />,
  },
  mood: {
    label: 'Mood Ring',
    description: 'Your current emotional state',
    icon: <Smile size={20} color={Colors.light.warning} />,
  },
  breathing: {
    label: 'Quick Breathe',
    description: 'One-tap breathing exercise',
    icon: <Wind size={20} color={Colors.light.secondary} />,
  },
  weekly: {
    label: 'Weekly Pulse',
    description: 'Visual chart of your week',
    icon: <BarChart3 size={20} color={Colors.light.primary} />,
  },
  journal: {
    label: 'Journal Prompt',
    description: 'Daily writing inspiration',
    icon: <BookOpen size={20} color={Colors.light.primary} />,
  },
};

interface WidgetConfigModalProps {
  visible: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggle: (id: WidgetType) => void;
  onReorder: (orderedIds: WidgetType[]) => void;
}

export default function WidgetConfigModal({
  visible,
  onClose,
  widgets,
  onToggle,
  onReorder,
}: WidgetConfigModalProps) {
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>([]);

  const sorted = (localWidgets.length > 0 ? localWidgets : [...widgets]).sort((a, b) => a.order - b.order);

  const handleOpen = useCallback(() => {
    setLocalWidgets([...widgets]);
  }, [widgets]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleToggle = useCallback((id: WidgetType) => {
    triggerHaptic();
    onToggle(id);
    setLocalWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  }, [onToggle, triggerHaptic]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    triggerHaptic();
    const newOrder = sorted.map(w => w.id);
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorder(newOrder);
    setLocalWidgets(prev => prev.map(w => ({ ...w, order: newOrder.indexOf(w.id) })));
  }, [sorted, onReorder, triggerHaptic]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === sorted.length - 1) return;
    triggerHaptic();
    const newOrder = sorted.map(w => w.id);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorder(newOrder);
    setLocalWidgets(prev => prev.map(w => ({ ...w, order: newOrder.indexOf(w.id) })));
  }, [sorted, onReorder, triggerHaptic]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <LayoutGrid size={18} color={Colors.light.primary} />
              <Text style={styles.title}>Customize Widgets</Text>
            </View>
            <View style={styles.closeBtn} />
          </View>

          <Text style={styles.subtitle}>
            Toggle and reorder widgets on your home screen
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {sorted.map((widget, index) => {
              const meta = WIDGET_META[widget.id];
              return (
                <View key={widget.id} style={[styles.widgetItem, !widget.enabled && styles.widgetItemDisabled]}>
                  <View style={styles.widgetIconWrap}>
                    {meta.icon}
                  </View>
                  <View style={styles.widgetInfo}>
                    <Text style={[styles.widgetName, !widget.enabled && styles.widgetNameDisabled]}>
                      {meta.label}
                    </Text>
                    <Text style={styles.widgetDesc}>{meta.description}</Text>
                  </View>
                  <View style={styles.widgetActions}>
                    <View style={styles.reorderBtns}>
                      <TouchableOpacity
                        style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                        onPress={() => handleMoveUp(index)}
                        disabled={index === 0}
                        activeOpacity={0.6}
                      >
                        <ChevronUp size={16} color={index === 0 ? Colors.light.border : Colors.light.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.reorderBtn, index === sorted.length - 1 && styles.reorderBtnDisabled]}
                        onPress={() => handleMoveDown(index)}
                        disabled={index === sorted.length - 1}
                        activeOpacity={0.6}
                      >
                        <ChevronDown size={16} color={index === sorted.length - 1 ? Colors.light.border : Colors.light.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={widget.enabled}
                      onValueChange={() => handleToggle(widget.id)}
                      trackColor={{ false: Colors.light.border, true: Colors.light.secondary + '60' }}
                      thumbColor={widget.enabled ? Colors.light.secondary : Colors.light.textTertiary}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontWeight: '700' as const, color: Colors.light.text, letterSpacing: -0.2 },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    lineHeight: 20,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  widgetItemDisabled: { opacity: 0.55 },
  widgetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetInfo: { flex: 1, gap: 2 },
  widgetName: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.text },
  widgetNameDisabled: { color: Colors.light.textTertiary },
  widgetDesc: { fontSize: 12, color: Colors.light.textSecondary },
  widgetActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reorderBtns: { gap: 2 },
  reorderBtn: {
    width: 28,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: Colors.light.subtle,
  },
  reorderBtnDisabled: { backgroundColor: 'transparent' },
  footer: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  doneBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },
});
