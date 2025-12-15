// client/src/hooks/useHabits.js
import { useState, useEffect } from 'react';
import { habitDB } from '../utils/idb';
import { habitsAPI } from '../utils/api';
import { generateId } from '../utils/storage';

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadHabits();
    loadStats();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const allHabits = await habitDB.getAll();
      const activeHabits = allHabits.filter(h => !h.deleted);
      // Sort by streak (highest first)
      activeHabits.sort((a, b) => b.streak - a.streak);
      setHabits(activeHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (navigator.onLine) {
        const response = await habitsAPI.getStats();
        if (response.success) {
          setStats(response.data);
        }
      }
    } catch (error) {
      console.log('Stats unavailable offline');
    }
  };

  const addHabit = async (habitData) => {
    try {
      const newHabit = {
        id: generateId(),
        ...habitData,
        streak: 0,
        last_completed: null,
        deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await habitDB.add(newHabit);
      
      try {
        if (navigator.onLine) {
          await habitsAPI.create(newHabit);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadHabits();
      return newHabit;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  };

  const updateHabit = async (id, updates) => {
    try {
      const existingHabit = await habitDB.getById(id);
      const updatedHabit = {
        ...existingHabit,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await habitDB.update(updatedHabit);

      try {
        if (navigator.onLine) {
          await habitsAPI.update(id, updatedHabit);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadHabits();
      return updatedHabit;
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  };

  const deleteHabit = async (id) => {
    try {
      await updateHabit(id, { deleted: true });
      
      try {
        if (navigator.onLine) {
          await habitsAPI.delete(id);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  };

  const completeHabit = async (id) => {
    try {
      const habit = await habitDB.getById(id);
      const now = new Date();
      
      // Check if already completed today/this week
      if (habit.last_completed) {
        const lastCompleted = new Date(habit.last_completed);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDate = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
        
        if (habit.frequency === 'daily' && today.getTime() === lastDate.getTime()) {
          throw new Error('Already completed today!');
        }
        
        if (habit.frequency === 'weekly') {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          
          if (lastCompleted >= weekStart) {
            throw new Error('Already completed this week!');
          }
        }
      }

      // Calculate new streak
      let newStreak = habit.streak;
      if (habit.last_completed) {
        const lastCompleted = new Date(habit.last_completed);
        const diffTime = Math.abs(now - lastCompleted);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (habit.frequency === 'daily') {
          newStreak = diffDays <= 1 ? habit.streak + 1 : 1;
        } else if (habit.frequency === 'weekly') {
          newStreak = diffDays <= 7 ? habit.streak + 1 : 1;
        }
      } else {
        newStreak = 1;
      }

      const updatedHabit = {
        ...habit,
        streak: newStreak,
        last_completed: now.toISOString(),
        updated_at: now.toISOString()
      };

      await habitDB.update(updatedHabit);

      try {
        if (navigator.onLine) {
          await habitsAPI.complete(id);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadHabits();
      await loadStats();
      return updatedHabit;
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  };

  const resetStreak = async (id) => {
    try {
      await updateHabit(id, { 
        streak: 0, 
        last_completed: null 
      });

      try {
        if (navigator.onLine) {
          await habitsAPI.reset(id);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadHabits();
      await loadStats();
    } catch (error) {
      console.error('Error resetting streak:', error);
      throw error;
    }
  };

  return {
    habits,
    loading,
    stats,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    resetStreak,
    refresh: loadHabits
  };
};