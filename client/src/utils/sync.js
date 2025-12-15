// client/src/utils/sync.js
import { tasksAPI, notesAPI, habitsAPI, pomodoroAPI } from './api';
import { taskDB, noteDB, habitDB, pomodorooDB, syncQueueDB } from './idb';
import { SYNC_STATUS } from './constants';

// Sync manager class
class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Sync tasks
  async syncTasks() {
    if (!this.isOnline()) {
      console.log('⚠️ Offline - skipping tasks sync');
      return { success: false, error: 'Offline' };
    }

    try {
      console.log('🔄 Syncing tasks...');
      
      // Get all local tasks
      const localTasks = await taskDB.getAll();
      
      // Sync with server
      const result = await tasksAPI.batchSync(localTasks, this.lastSyncTime);
      
      // Update local database with server data
      if (result.success && result.serverTasks) {
        for (const task of result.serverTasks) {
          await taskDB.update(task);
        }
      }
      
      console.log('✅ Tasks synced:', result);
      return result;
    } catch (error) {
      console.error('❌ Tasks sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync notes
  async syncNotes() {
    if (!this.isOnline()) {
      console.log('⚠️ Offline - skipping notes sync');
      return { success: false, error: 'Offline' };
    }

    try {
      console.log('🔄 Syncing notes...');
      
      const localNotes = await noteDB.getAll();
      const result = await notesAPI.batchSync(localNotes, this.lastSyncTime);
      
      if (result.success && result.serverNotes) {
        for (const note of result.serverNotes) {
          await noteDB.update(note);
        }
      }
      
      console.log('✅ Notes synced:', result);
      return result;
    } catch (error) {
      console.error('❌ Notes sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync habits
  async syncHabits() {
    if (!this.isOnline()) {
      console.log('⚠️ Offline - skipping habits sync');
      return { success: false, error: 'Offline' };
    }

    try {
      console.log('🔄 Syncing habits...');
      
      const localHabits = await habitDB.getAll();
      const result = await habitsAPI.batchSync(localHabits, this.lastSyncTime);
      
      if (result.success && result.serverHabits) {
        for (const habit of result.serverHabits) {
          await habitDB.update(habit);
        }
      }
      
      console.log('✅ Habits synced:', result);
      return result;
    } catch (error) {
      console.error('❌ Habits sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync pomodoro sessions
  async syncPomodoro() {
    if (!this.isOnline()) {
      console.log('⚠️ Offline - skipping pomodoro sync');
      return { success: false, error: 'Offline' };
    }

    try {
      console.log('🔄 Syncing pomodoro sessions...');
      
      const localSessions = await pomodorooDB.getAll();
      const result = await pomodoroAPI.batchSync(localSessions, this.lastSyncTime);
      
      if (result.success && result.serverSessions) {
        for (const session of result.serverSessions) {
          await pomodorooDB.add(session);
        }
      }
      
      console.log('✅ Pomodoro synced:', result);
      return result;
    } catch (error) {
      console.error('❌ Pomodoro sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync all data
  async syncAll() {
    if (this.isSyncing) {
      console.log('⚠️ Sync already in progress');
      return { success: false, error: 'Sync in progress' };
    }

    if (!this.isOnline()) {
      console.log('⚠️ Offline - cannot sync');
      return { success: false, error: 'Offline' };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      console.log('🔄 Starting full sync...');

      const results = await Promise.allSettled([
        this.syncTasks(),
        this.syncNotes(),
        this.syncHabits(),
        this.syncPomodoro(),
      ]);

      const summary = {
        tasks: results[0].status === 'fulfilled' ? results[0].value : { success: false },
        notes: results[1].status === 'fulfilled' ? results[1].value : { success: false },
        habits: results[2].status === 'fulfilled' ? results[2].value : { success: false },
        pomodoro: results[3].status === 'fulfilled' ? results[3].value : { success: false },
      };

      this.lastSyncTime = new Date().toISOString();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Full sync completed in ${duration}ms`);
      
      return {
        success: true,
        summary,
        duration,
        timestamp: this.lastSyncTime,
      };
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Auto-sync on reconnection
  setupAutoSync() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - triggering auto-sync');
      setTimeout(() => this.syncAll(), 1000);
    });
  }
}

// Create singleton instance
export const syncManager = new SyncManager();

// Setup auto-sync
syncManager.setupAutoSync();

export default syncManager;