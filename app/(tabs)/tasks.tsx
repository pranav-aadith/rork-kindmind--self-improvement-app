import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Calendar,
  Trash2,
  Edit3,
  Flame,
  Trophy,
  Target,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTasks } from '@/providers/TaskProvider';
import type { Task } from '@/types';

const DUOLINGO = {
  green: '#58CC02',
  greenDark: '#46A302',
  greenLight: '#89E219',
  blue: '#1CB0F6',
  blueDark: '#1899D6',
  orange: '#FF9600',
  red: '#FF4B4B',
  purple: '#CE82FF',
  yellow: '#FFC800',
  white: '#FFFFFF',
  gray100: '#F7F7F7',
  gray200: '#E5E5E5',
  gray300: '#AFAFAF',
  gray400: '#777777',
  gray500: '#4B4B4B',
  background: '#131F24',
  cardBg: '#1A2C35',
  cardBorder: '#37464F',
};

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
};

const formatLocalDateUtil = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function DatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const selectedDateObj = new Date(value + 'T00:00:00');
  const [pickerYear, setPickerYear] = useState(selectedDateObj.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(selectedDateObj.getMonth());
  
  const pickerInfo = getDaysInMonth(new Date(pickerYear, pickerMonth, 1));

  return (
    <View style={styles.datePickerContainer}>
      <View style={styles.datePickerHeader}>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (pickerMonth === 0) {
              setPickerMonth(11);
              setPickerYear(pickerYear - 1);
            } else {
              setPickerMonth(pickerMonth - 1);
            }
          }}
          style={styles.dateNavBtn}
        >
          <ChevronLeft size={18} color={DUOLINGO.white} />
        </TouchableOpacity>
        <Text style={styles.datePickerTitle}>
          {MONTHS[pickerMonth]} {pickerYear}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (pickerMonth === 11) {
              setPickerMonth(0);
              setPickerYear(pickerYear + 1);
            } else {
              setPickerMonth(pickerMonth + 1);
            }
          }}
          style={styles.dateNavBtn}
        >
          <ChevronRight size={18} color={DUOLINGO.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.datePickerDaysHeader}>
        {DAYS.map((day, i) => (
          <Text key={i} style={styles.datePickerDayLabel}>{day}</Text>
        ))}
      </View>

      <View style={styles.datePickerGrid}>
        {Array(pickerInfo.firstDay).fill(null).map((_, i) => (
          <View key={`empty-${i}`} style={styles.datePickerDay} />
        ))}
        {Array(pickerInfo.daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dateStr = formatLocalDateUtil(new Date(pickerYear, pickerMonth, day));
          const isSelected = dateStr === value;

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.datePickerDay,
                isSelected && styles.datePickerDaySelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(dateStr);
              }}
            >
              <Text style={[
                styles.datePickerDayText,
                isSelected && styles.datePickerDayTextSelected,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TaskCard({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete 
}: { 
  task: Task; 
  onToggle: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkScaleAnim = useRef(new Animated.Value(task.completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkScaleAnim, {
      toValue: task.completed ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [task.completed]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleToggle = () => {
    if (!task.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  };

  return (
    <Animated.View style={[styles.taskCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.taskCardInner}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleToggle}
        activeOpacity={1}
      >
        <View style={[
          styles.checkbox,
          task.completed && styles.checkboxCompleted,
        ]}>
          <Animated.View style={{
            transform: [{ scale: checkScaleAnim }],
            opacity: checkScaleAnim,
          }}>
            <Check size={18} color={DUOLINGO.white} strokeWidth={3} />
          </Animated.View>
        </View>

        <View style={styles.taskContent}>
          <Text style={[
            styles.taskTitle,
            task.completed && styles.taskTitleCompleted,
          ]}>
            {task.title}
          </Text>
          {task.description ? (
            <Text style={[
              styles.taskDescription,
              task.completed && styles.taskDescriptionCompleted,
            ]} numberOfLines={1}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.taskMeta}>
            <Calendar size={12} color={DUOLINGO.gray300} />
            <Text style={styles.taskDate}>{task.dueDate}</Text>
          </View>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit();
            }}
          >
            <Edit3 size={16} color={DUOLINGO.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete();
            }}
          >
            <Trash2 size={16} color={DUOLINGO.red} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TasksScreen() {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleComplete, 
    getTasksByDate,
    tasksWithDates,
    formatLocalDate,
    completedTasks,
    pendingTasks,
  } = useTasks();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(formatLocalDate(new Date()));

  const addButtonAnim = useRef(new Animated.Value(1)).current;

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const today = formatLocalDate(new Date());
  
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(formatLocalDate(selected));
    setViewMode('today');
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Oops!', 'Please enter a task title');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate,
    });

    setNewTitle('');
    setNewDescription('');
    setNewDueDate(selectedDate);
    setShowAddModal(false);
  };

  const handleEditTask = () => {
    if (!editingTask || !newTitle.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Oops!', 'Please enter a task title');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateTask(editingTask.id, {
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate,
    });

    setEditingTask(null);
    setNewTitle('');
    setNewDescription('');
    setShowEditModal(false);
  };

  const handleDeleteTask = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Task?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            deleteTask(id);
          },
        },
      ]
    );
  };

  const openEditModal = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description);
    setNewDueDate(task.dueDate);
    setShowEditModal(true);
  };

  const openAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(addButtonAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.spring(addButtonAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    setNewTitle('');
    setNewDescription('');
    setNewDueDate(selectedDate);
    setShowAddModal(true);
  };

  const displayedTasks = viewMode === 'today' 
    ? getTasksByDate(selectedDate)
    : tasks;

  const sortedTasks = [...displayedTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatLocalDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === today;
      const hasTasks = tasksWithDates[dateStr] > 0;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDay,
            isToday && !isSelected && styles.todayCell,
          ]}
          onPress={() => handleDateSelect(day)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayText,
          ]}>
            {day}
          </Text>
          {hasTasks && !isSelected && (
            <View style={styles.taskDot} />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Tasks</Text>
            <Text style={styles.headerSubtitle}>Stay on track!</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: addButtonAnim }] }}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddModal}
              activeOpacity={0.9}
            >
              <Plus size={24} color={DUOLINGO.white} strokeWidth={3} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: DUOLINGO.orange + '20' }]}>
                <Flame size={20} color={DUOLINGO.orange} />
              </View>
              <Text style={styles.statValue}>{pendingTasks.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: DUOLINGO.green + '20' }]}>
                <Trophy size={20} color={DUOLINGO.green} />
              </View>
              <Text style={styles.statValue}>{completedTasks.length}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: DUOLINGO.purple + '20' }]}>
                <Target size={20} color={DUOLINGO.purple} />
              </View>
              <Text style={styles.statValue}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                <ChevronLeft size={22} color={DUOLINGO.white} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <ChevronRight size={22} color={DUOLINGO.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysHeader}>
              {DAYS.map((day, i) => (
                <Text key={i} style={styles.dayLabel}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {renderCalendarDays()}
            </View>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'today' && styles.toggleButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('today');
              }}
            >
              <Text style={[styles.toggleText, viewMode === 'today' && styles.toggleTextActive]}>
                {selectedDate === today ? 'Today' : 'Selected'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'all' && styles.toggleButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('all');
              }}
            >
              <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>
                All Tasks
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tasksList}>
            {sortedTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Sparkles size={40} color={DUOLINGO.yellow} />
                </View>
                <Text style={styles.emptyTitle}>No tasks yet!</Text>
                <Text style={styles.emptySubtitle}>
                  {viewMode === 'today' 
                    ? 'Tap + to add a task for this day' 
                    : 'Start adding tasks to stay organized'}
                </Text>
              </View>
            ) : (
              sortedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task.id)}
                  onEdit={() => openEditModal(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddModal(false);
                }}
                style={styles.closeBtn}
              >
                <X size={22} color={DUOLINGO.gray300} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>What do you need to do?</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task title..."
                placeholderTextColor={DUOLINGO.gray400}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />

              <Text style={styles.inputLabel}>Details (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add more details..."
                placeholderTextColor={DUOLINGO.gray400}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>When is it due?</Text>
              <DatePicker value={newDueDate} onChange={setNewDueDate} />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddTask}
                activeOpacity={0.9}
              >
                <Text style={styles.saveButtonText}>Add Task</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Task</Text>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowEditModal(false);
                }}
                style={styles.closeBtn}
              >
                <X size={22} color={DUOLINGO.gray300} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>What do you need to do?</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task title..."
                placeholderTextColor={DUOLINGO.gray400}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.inputLabel}>Details (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add more details..."
                placeholderTextColor={DUOLINGO.gray400}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>When is it due?</Text>
              <DatePicker value={newDueDate} onChange={setNewDueDate} />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: DUOLINGO.blue }]}
                onPress={handleEditTask}
                activeOpacity={0.9}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DUOLINGO.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: DUOLINGO.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DUOLINGO.gray300,
    marginTop: 2,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: DUOLINGO.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: DUOLINGO.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderBottomWidth: 4,
    borderBottomColor: DUOLINGO.greenDark,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: DUOLINGO.cardBg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DUOLINGO.cardBorder,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: DUOLINGO.white,
  },
  statLabel: {
    fontSize: 12,
    color: DUOLINGO.gray300,
    marginTop: 2,
  },
  calendarCard: {
    backgroundColor: DUOLINGO.cardBg,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: DUOLINGO.cardBorder,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DUOLINGO.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: DUOLINGO.white,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700' as const,
    color: DUOLINGO.gray400,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: DUOLINGO.green,
    borderRadius: 14,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: DUOLINGO.blue,
    borderRadius: 14,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: DUOLINGO.white,
  },
  selectedDayText: {
    color: DUOLINGO.white,
    fontWeight: '800' as const,
  },
  todayText: {
    color: DUOLINGO.blue,
    fontWeight: '700' as const,
  },
  taskDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: DUOLINGO.orange,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: DUOLINGO.cardBg,
    borderRadius: 14,
    padding: 4,
    borderWidth: 2,
    borderColor: DUOLINGO.cardBorder,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: DUOLINGO.green,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: DUOLINGO.gray400,
  },
  toggleTextActive: {
    color: DUOLINGO.white,
  },
  tasksList: {
    paddingHorizontal: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DUOLINGO.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: DUOLINGO.cardBorder,
    borderBottomWidth: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: DUOLINGO.gray400,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: DUOLINGO.green,
    borderColor: DUOLINGO.green,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: DUOLINGO.white,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: DUOLINGO.gray400,
  },
  taskDescription: {
    fontSize: 13,
    color: DUOLINGO.gray300,
    marginBottom: 6,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: DUOLINGO.gray400,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDate: {
    fontSize: 12,
    color: DUOLINGO.gray400,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: DUOLINGO.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: DUOLINGO.yellow + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: DUOLINGO.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: DUOLINGO.gray400,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DUOLINGO.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: DUOLINGO.gray400,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: DUOLINGO.white,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: DUOLINGO.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: DUOLINGO.gray300,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: DUOLINGO.background,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: DUOLINGO.white,
    borderWidth: 2,
    borderColor: DUOLINGO.cardBorder,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  datePickerContainer: {
    backgroundColor: DUOLINGO.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: DUOLINGO.cardBorder,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: DUOLINGO.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: DUOLINGO.white,
  },
  datePickerDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  datePickerDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700' as const,
    color: DUOLINGO.gray400,
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  datePickerDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerDaySelected: {
    backgroundColor: DUOLINGO.green,
    borderRadius: 12,
  },
  datePickerDayText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: DUOLINGO.white,
  },
  datePickerDayTextSelected: {
    color: DUOLINGO.white,
    fontWeight: '800' as const,
  },
  saveButton: {
    backgroundColor: DUOLINGO.green,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: DUOLINGO.greenDark,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: DUOLINGO.white,
    letterSpacing: 0.5,
  },
});
