import React, { useState } from 'react';
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
  Circle,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useTasks } from '@/providers/TaskProvider';
import type { Task } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        <TouchableOpacity onPress={() => {
          if (pickerMonth === 0) {
            setPickerMonth(11);
            setPickerYear(pickerYear - 1);
          } else {
            setPickerMonth(pickerMonth - 1);
          }
        }}>
          <ChevronLeft size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.datePickerTitle}>
          {MONTHS[pickerMonth]} {pickerYear}
        </Text>
        <TouchableOpacity onPress={() => {
          if (pickerMonth === 11) {
            setPickerMonth(0);
            setPickerYear(pickerYear + 1);
          } else {
            setPickerMonth(pickerMonth + 1);
          }
        }}>
          <ChevronRight size={20} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.datePickerDaysHeader}>
        {DAYS.map(day => (
          <Text key={day} style={styles.datePickerDayLabel}>{day}</Text>
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
              onPress={() => onChange(dateStr)}
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
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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


  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(formatLocalDate(selected));
    setViewMode('today');
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
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
      Alert.alert('Error', 'Please enter a task title');
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
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTask(id),
        },
      ]
    );
  };

  const handleToggleComplete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleComplete(id);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description);
    setNewDueDate(task.dueDate);
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setNewTitle('');
    setNewDescription('');
    setNewDueDate(selectedDate);
    setShowAddModal(true);
  };

  const displayedTasks = viewMode === 'today' 
    ? getTasksByDate(selectedDate)
    : tasks;

  const today = formatLocalDate(new Date());

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
          {hasTasks && (
            <View style={[
              styles.taskDot,
              isSelected && styles.taskDotSelected,
            ]} />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderTask = (task: Task) => (
    <View 
      key={task.id} 
      style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
    >
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => handleToggleComplete(task.id)}
        activeOpacity={0.7}
      >
        {task.completed ? (
          <CheckCircle2 size={26} color={Colors.light.success} />
        ) : (
          <Circle size={26} color={Colors.light.textSecondary} />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.taskContent}
        onPress={() => openEditModal(task)}
        activeOpacity={0.8}
      >
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
          {task.title}
        </Text>
        {task.description ? (
          <Text style={[styles.taskDescription, task.completed && styles.taskDescriptionCompleted]}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.taskMeta}>
          <Calendar size={12} color={Colors.light.textSecondary} />
          <Text style={styles.taskDate}>{task.dueDate}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(task)}
          activeOpacity={0.7}
        >
          <Edit3 size={18} color={Colors.light.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteTask(task.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color={Colors.light.error} />
        </TouchableOpacity>
      </View>
    </View>
  );



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <ChevronRight size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysHeader}>
            {DAYS.map(day => (
              <Text key={day} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {renderCalendarDays()}
          </View>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'today' && styles.toggleButtonActive]}
            onPress={() => setViewMode('today')}
          >
            <Text style={[styles.toggleText, viewMode === 'today' && styles.toggleTextActive]}>
              {selectedDate === today ? 'Today' : selectedDate}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'all' && styles.toggleButtonActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>
              All Tasks
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tasksList}>
          {displayedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No tasks</Text>
              <Text style={styles.emptySubtitle}>
                {viewMode === 'today' 
                  ? 'No tasks for this date' 
                  : 'Add your first task to get started'}
              </Text>
            </View>
          ) : (
            displayedTasks
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return b.createdAt - a.createdAt;
              })
              .map(renderTask)
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What needs to be done?"
                placeholderTextColor={Colors.light.textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details..."
                placeholderTextColor={Colors.light.textSecondary}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Due Date</Text>
              <DatePicker value={newDueDate} onChange={setNewDueDate} />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddTask}
                activeOpacity={0.8}
              >
                <Check size={20} color="#FFF" />
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Task</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What needs to be done?"
                placeholderTextColor={Colors.light.textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details..."
                placeholderTextColor={Colors.light.textSecondary}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Due Date</Text>
              <DatePicker value={newDueDate} onChange={setNewDueDate} />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEditTask}
                activeOpacity={0.8}
              >
                <Check size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    fontWeight: '700' as const,
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  calendarCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.text,
    borderRadius: 20,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600' as const,
  },
  todayText: {
    color: Colors.light.secondary,
    fontWeight: '600' as const,
  },
  taskDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.light.secondary,
  },
  taskDotSelected: {
    backgroundColor: '#FFF',
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.text,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  tasksList: {
    paddingHorizontal: 16,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: Colors.light.background,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  datePickerContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePickerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  datePickerDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  datePickerDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.text,
    borderRadius: 16,
  },
  datePickerDayText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  datePickerDayTextSelected: {
    color: '#FFF',
    fontWeight: '600' as const,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.text,
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
    marginBottom: 20,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
