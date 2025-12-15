// client/src/hooks/usePomodoro.js
import { useState, useEffect, useRef } from 'react';
import { pomodorooDB } from '../utils/idb';
import { pomodoroAPI } from '../utils/api';
import { generateId } from '../utils/storage';

export const usePomodoro = () => {
  const [sessions, setSessions] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const allSessions = await pomodorooDB.getAll();
      allSessions.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
      setSessions(allSessions);

      // Filter today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayList = allSessions.filter(s => {
        const sessionDate = new Date(s.completed_at);
        return sessionDate >= today;
      });
      setTodaySessions(todayList);
    } catch (error) {
      console.error('Error loading pomodoro sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (navigator.onLine) {
        const response = await pomodoroAPI.getStats(7);
        if (response.success) {
          setStats(response.data);
        }
      }
    } catch (error) {
      console.log('Stats unavailable offline');
    }
  };

  const logSession = async (minutes) => {
    try {
      const newSession = {
        id: generateId(),
        minutes,
        completed_at: new Date().toISOString()
      };

      await pomodorooDB.add(newSession);
      
      try {
        if (navigator.onLine) {
          await pomodoroAPI.logSession(newSession);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadSessions();
      await loadStats();
      return newSession;
    } catch (error) {
      console.error('Error logging session:', error);
      throw error;
    }
  };

  const deleteSession = async (id) => {
    try {
      await pomodorooDB.delete(id);
      
      try {
        if (navigator.onLine) {
          await pomodoroAPI.deleteSession(id);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadSessions();
      await loadStats();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };

  const getTodayStats = () => {
    const totalMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);
    return {
      sessions: todaySessions.length,
      minutes: totalMinutes,
      hours: (totalMinutes / 60).toFixed(1)
    };
  };

  return {
    sessions,
    todaySessions,
    stats,
    loading,
    logSession,
    deleteSession,
    getTodayStats,
    refresh: loadSessions
  };
};