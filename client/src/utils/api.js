// client/src/utils/api.js
import { API_URL } from './constants';

// API client class
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const api = new APIClient(API_URL);

// ============================================
// TASKS API
// ============================================
export const tasksAPI = {
  getAll: (params = {}) => api.get('/tasks', params),
  
  getById: (id) => api.get(`/tasks/${id}`),
  
  create: (task) => api.post('/tasks', task),
  
  update: (id, task) => api.put(`/tasks/${id}`, task),
  
  delete: (id, hard = false) => api.delete(`/tasks/${id}`, { hard }),
  
  batchSync: (tasks, lastSyncTime) => 
    api.post('/tasks/sync/batch', { tasks, lastSyncTime }),
};

// ============================================
// NOTES API
// ============================================
export const notesAPI = {
  getAll: (params = {}) => api.get('/notes', params),
  
  getById: (id) => api.get(`/notes/${id}`),
  
  search: (query) => api.get('/notes/search/query', { q: query }),
  
  create: (note) => api.post('/notes', note),
  
  update: (id, note) => api.put(`/notes/${id}`, note),
  
  delete: (id, hard = false) => api.delete(`/notes/${id}`, { hard }),
  
  batchSync: (notes, lastSyncTime) => 
    api.post('/notes/sync/batch', { notes, lastSyncTime }),
};

// ============================================
// HABITS API
// ============================================
export const habitsAPI = {
  getAll: (params = {}) => api.get('/habits', params),
  
  getById: (id) => api.get(`/habits/${id}`),
  
  getStats: () => api.get('/habits/stats/summary'),
  
  create: (habit) => api.post('/habits', habit),
  
  update: (id, habit) => api.put(`/habits/${id}`, habit),
  
  complete: (id) => api.post(`/habits/${id}/complete`),
  
  reset: (id) => api.post(`/habits/${id}/reset`),
  
  delete: (id, hard = false) => api.delete(`/habits/${id}`, { hard }),
  
  batchSync: (habits, lastSyncTime) => 
    api.post('/habits/sync/batch', { habits, lastSyncTime }),
};

// ============================================
// POMODORO API
// ============================================
export const pomodoroAPI = {
  getAllSessions: (params = {}) => api.get('/pomodoro/logs', params),
  
  getSessionById: (id) => api.get(`/pomodoro/logs/${id}`),
  
  getTodaySessions: () => api.get('/pomodoro/today'),
  
  getStats: (days = 7) => api.get('/pomodoro/stats', { days }),
  
  logSession: (session) => api.post('/pomodoro/log', session),
  
  deleteSession: (id) => api.delete(`/pomodoro/logs/${id}`),
  
  batchSync: (sessions, lastSyncTime) => 
    api.post('/pomodoro/sync/batch', { sessions, lastSyncTime }),
};

export default api;