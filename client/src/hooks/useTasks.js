import { useState, useEffect } from 'react';
import { taskDB } from '../utils/idb';
import { tasksAPI } from '../utils/api';
import { generateId } from '../utils/storage';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, completed

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await taskDB.getAll();
      const activeTasks = allTasks.filter(t => !t.deleted);
      setTasks(activeTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const newTask = {
        id: generateId(),
        ...taskData,
        completed: false,
        deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save locally first
      await taskDB.add(newTask);
      
      // Try to sync to server
      try {
        if (navigator.onLine) {
          await tasksAPI.create(newTask);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadTasks();
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const existingTask = await taskDB.getById(id);
      const updatedTask = {
        ...existingTask,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await taskDB.update(updatedTask);

      // Try to sync to server
      try {
        if (navigator.onLine) {
          await tasksAPI.update(id, updatedTask);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadTasks();
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      // Soft delete
      await updateTask(id, { deleted: true });
      
      // Try to delete from server
      try {
        if (navigator.onLine) {
          await tasksAPI.delete(id);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const toggleComplete = async (id) => {
    try {
      const task = await taskDB.getById(id);
      await updateTask(id, { completed: !task.completed });
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  };

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (filter) {
      case 'today':
        return tasks.filter(t => {
          if (!t.deadline) return false;
          const deadline = new Date(t.deadline);
          return deadline.toDateString() === today.toDateString();
        });
      
      case 'week':
        return tasks.filter(t => {
          if (!t.deadline) return false;
          const deadline = new Date(t.deadline);
          return deadline >= today && deadline <= weekFromNow;
        });
      
      case 'completed':
        return tasks.filter(t => t.completed);
      
      case 'active':
        return tasks.filter(t => !t.completed);
      
      default:
        return tasks;
    }
  };

  return {
    tasks: getFilteredTasks(),
    allTasks: tasks,
    loading,
    filter,
    setFilter,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    refresh: loadTasks
  };
};