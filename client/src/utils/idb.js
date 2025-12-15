import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from './constants';

let dbPromise = null;

// Initialize IndexedDB
export const initDB = async () => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

      // Tasks store
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        taskStore.createIndex('completed', 'completed');
        taskStore.createIndex('priority', 'priority');
        taskStore.createIndex('deadline', 'deadline');
        taskStore.createIndex('updated_at', 'updated_at');
      }

      // Notes store
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const noteStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        noteStore.createIndex('pinned', 'pinned');
        noteStore.createIndex('updated_at', 'updated_at');
      }

      // Habits store
      if (!db.objectStoreNames.contains(STORES.HABITS)) {
        const habitStore = db.createObjectStore(STORES.HABITS, { keyPath: 'id' });
        habitStore.createIndex('frequency', 'frequency');
        habitStore.createIndex('streak', 'streak');
        habitStore.createIndex('updated_at', 'updated_at');
      }

      // Pomodoro sessions store
      if (!db.objectStoreNames.contains(STORES.POMODORO)) {
        const pomodoroStore = db.createObjectStore(STORES.POMODORO, { keyPath: 'id' });
        pomodoroStore.createIndex('completed_at', 'completed_at');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        syncStore.createIndex('status', 'status');
        syncStore.createIndex('entity_type', 'entity_type');
        syncStore.createIndex('created_at', 'created_at');
      }
    },
  });

  const db = await dbPromise;
  console.log('✅ IndexedDB initialized:', db.name);
  return db;
};

// Generic CRUD operations
export const dbOperations = {
  // Get all items from a store
  async getAll(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },

  // Get item by ID
  async getById(storeName, id) {
    const db = await initDB();
    return db.get(storeName, id);
  },

  // Add item
  async add(storeName, item) {
    const db = await initDB();
    const itemWithTimestamp = {
      ...item,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await db.add(storeName, itemWithTimestamp);
    return itemWithTimestamp;
  },

  // Update item
  async update(storeName, item) {
    const db = await initDB();
    const itemWithTimestamp = {
      ...item,
      updated_at: new Date().toISOString()
    };
    await db.put(storeName, itemWithTimestamp);
    return itemWithTimestamp;
  },

  // Delete item
  async delete(storeName, id) {
    const db = await initDB();
    await db.delete(storeName, id);
    return true;
  },

  // Clear all items in a store
  async clear(storeName) {
    const db = await initDB();
    await db.clear(storeName);
    return true;
  },

  // Get items by index
  async getByIndex(storeName, indexName, value) {
    const db = await initDB();
    const index = db.transaction(storeName).store.index(indexName);
    return index.getAll(value);
  },

  // Count items in store
  async count(storeName) {
    const db = await initDB();
    return db.count(storeName);
  }
};

// Task-specific operations
export const taskDB = {
  async getAll() {
    return dbOperations.getAll(STORES.TASKS);
  },

  async getById(id) {
    return dbOperations.getById(STORES.TASKS, id);
  },

  async add(task) {
    return dbOperations.add(STORES.TASKS, task);
  },

  async update(task) {
    return dbOperations.update(STORES.TASKS, task);
  },

  async delete(id) {
    return dbOperations.delete(STORES.TASKS, id);
  },

  async getByCompleted(completed) {
    return dbOperations.getByIndex(STORES.TASKS, 'completed', completed);
  },

  async getByPriority(priority) {
    return dbOperations.getByIndex(STORES.TASKS, 'priority', priority);
  }
};

// Note-specific operations
export const noteDB = {
  async getAll() {
    return dbOperations.getAll(STORES.NOTES);
  },

  async getById(id) {
    return dbOperations.getById(STORES.NOTES, id);
  },

  async add(note) {
    return dbOperations.add(STORES.NOTES, note);
  },

  async update(note) {
    return dbOperations.update(STORES.NOTES, note);
  },

  async delete(id) {
    return dbOperations.delete(STORES.NOTES, id);
  },

  async getPinned() {
    return dbOperations.getByIndex(STORES.NOTES, 'pinned', true);
  }
};

// Habit-specific operations
export const habitDB = {
  async getAll() {
    return dbOperations.getAll(STORES.HABITS);
  },

  async getById(id) {
    return dbOperations.getById(STORES.HABITS, id);
  },

  async add(habit) {
    return dbOperations.add(STORES.HABITS, habit);
  },

  async update(habit) {
    return dbOperations.update(STORES.HABITS, habit);
  },

  async delete(id) {
    return dbOperations.delete(STORES.HABITS, id);
  },

  async getByFrequency(frequency) {
    return dbOperations.getByIndex(STORES.HABITS, 'frequency', frequency);
  }
};

// Pomodoro-specific operations
export const pomodorooDB = {
  async getAll() {
    return dbOperations.getAll(STORES.POMODORO);
  },

  async getById(id) {
    return dbOperations.getById(STORES.POMODORO, id);
  },

  async add(session) {
    return dbOperations.add(STORES.POMODORO, session);
  },

  async delete(id) {
    return dbOperations.delete(STORES.POMODORO, id);
  },

  async getToday() {
    const db = await initDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessions = await db.getAll(STORES.POMODORO);
    return sessions.filter(session => {
      const sessionDate = new Date(session.completed_at);
      return sessionDate >= today;
    });
  }
};

// Sync queue operations
export const syncQueueDB = {
  async add(entity_type, action, data) {
    const queueItem = {
      entity_type,
      action,
      data,
      status: 'pending',
      created_at: new Date().toISOString(),
      retry_count: 0
    };
    return dbOperations.add(STORES.SYNC_QUEUE, queueItem);
  },

  async getAll() {
    return dbOperations.getAll(STORES.SYNC_QUEUE);
  },

  async getPending() {
    return dbOperations.getByIndex(STORES.SYNC_QUEUE, 'status', 'pending');
  },

  async update(item) {
    return dbOperations.update(STORES.SYNC_QUEUE, item);
  },

  async delete(id) {
    return dbOperations.delete(STORES.SYNC_QUEUE, id);
  },

  async clear() {
    return dbOperations.clear(STORES.SYNC_QUEUE);
  }
};