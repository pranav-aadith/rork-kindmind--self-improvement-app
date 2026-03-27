import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

const getStorageKey = (userId: string) => `kindmind_tasks_${userId}`;

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const [TaskProvider, useTasks] = createContextHook(() => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const storageKey = getStorageKey(user.id);
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTasks(parsed);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async (newTasks: Task[]) => {
    if (!user) return;
    try {
      const storageKey = getStorageKey(user.id);
      await AsyncStorage.setItem(storageKey, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  };

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: Date.now(),
      completed: false,
    };
    const newTasks = [newTask, ...tasks];
    saveTasks(newTasks);
    return newTask;
  }, [tasks]);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    saveTasks(newTasks);
  }, [tasks]);

  const deleteTask = useCallback((id: string) => {
    const newTasks = tasks.filter(task => task.id !== id);
    saveTasks(newTasks);
  }, [tasks]);

  const toggleComplete = useCallback((id: string) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(newTasks);
  }, [tasks]);

  const getTasksByDate = useCallback((date: string) => {
    return tasks.filter(task => task.dueDate === date);
  }, [tasks]);

  const tasksWithDates = useMemo(() => {
    const dateMap: Record<string, number> = {};
    tasks.forEach(task => {
      if (!dateMap[task.dueDate]) {
        dateMap[task.dueDate] = 0;
      }
      dateMap[task.dueDate]++;
    });
    return dateMap;
  }, [tasks]);

  const todayTasks = useMemo(() => {
    const today = formatLocalDate(new Date());
    return tasks.filter(task => task.dueDate === today);
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => !task.completed);
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter(task => task.completed);
  }, [tasks]);

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    getTasksByDate,
    tasksWithDates,
    todayTasks,
    pendingTasks,
    completedTasks,
    formatLocalDate,
  };
});
