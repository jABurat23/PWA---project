// Database configuration
export const DB_NAME = 'productivity-dashboard';
export const DB_VERSION = 1;

// Store names
export const STORES = {
  TASKS: 'tasks',
  NOTES: 'notes',
  HABITS: 'habits',
  POMODORO: 'pomodoro_sessions',
  SYNC_QUEUE: 'sync_queue'
};

// Sync status
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed'
};

// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Priority levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Habit frequency
export const FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly'
};