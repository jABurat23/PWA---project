// server/src/controllers/pomodoroController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET all pomodoro sessions
const getAllSessions = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const limit = parseInt(req.query.limit) || 50;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    let query = 'SELECT * FROM pomodoro_sessions WHERE user_id = ?';
    const params = [userId];
    
    if (startDate) {
      query += ' AND completed_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND completed_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY completed_at DESC LIMIT ?';
    params.push(limit);
    
    const [sessions] = await pool.query(query, params);
    
    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pomodoro sessions'
    });
  }
};

// GET single session by ID
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const [sessions] = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pomodoro session not found'
      });
    }
    
    res.json({
      success: true,
      data: sessions[0]
    });
  } catch (error) {
    console.error('Error fetching pomodoro session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pomodoro session'
    });
  }
};

// POST log new pomodoro session
const logSession = async (req, res) => {
  try {
    const {
      id = uuidv4(),
      minutes,
      completed_at = new Date(),
      user_id = 'default_user'
    } = req.body;
    
    if (!minutes || minutes <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Minutes must be a positive number'
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO pomodoro_sessions (id, minutes, completed_at, user_id) 
       VALUES (?, ?, ?, ?)`,
      [id, minutes, completed_at, user_id]
    );
    
    // Fetch the created session
    const [sessions] = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE id = ?',
      [id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Pomodoro session logged successfully',
      data: sessions[0]
    });
  } catch (error) {
    console.error('Error logging pomodoro session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log pomodoro session'
    });
  }
};

// GET today's sessions
const getTodaySessions = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    
    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const [sessions] = await pool.query(
      `SELECT * FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND completed_at >= ? 
       AND completed_at < ?
       ORDER BY completed_at DESC`,
      [userId, startOfDay, endOfDay]
    );
    
    const totalMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
    const totalSessions = sessions.length;
    
    res.json({
      success: true,
      data: {
        sessions,
        summary: {
          totalSessions,
          totalMinutes,
          totalHours: (totalMinutes / 60).toFixed(1),
          date: startOfDay.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s sessions'
    });
  }
};

// GET statistics
const getStatistics = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const days = parseInt(req.query.days) || 7; // Default to last 7 days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const [sessions] = await pool.query(
      `SELECT * FROM pomodoro_sessions 
       WHERE user_id = ? 
       AND completed_at >= ?
       ORDER BY completed_at DESC`,
      [userId, startDate]
    );
    
    // Calculate statistics
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
    const averagePerDay = days > 0 ? (totalSessions / days).toFixed(1) : 0;
    
    // Group by date
    const sessionsByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.completed_at).toISOString().split('T')[0];
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = {
          count: 0,
          minutes: 0
        };
      }
      sessionsByDate[date].count++;
      sessionsByDate[date].minutes += session.minutes;
    });
    
    // Find most productive day
    let mostProductiveDay = null;
    let maxMinutes = 0;
    Object.entries(sessionsByDate).forEach(([date, stats]) => {
      if (stats.minutes > maxMinutes) {
        maxMinutes = stats.minutes;
        mostProductiveDay = { date, ...stats };
      }
    });
    
    // Calculate streak (consecutive days with at least 1 session)
    const today = new Date();
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sessionsByDate[dateStr] && sessionsByDate[dateStr].count > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    res.json({
      success: true,
      data: {
        period: {
          days,
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        totals: {
          sessions: totalSessions,
          minutes: totalMinutes,
          hours: (totalMinutes / 60).toFixed(1)
        },
        averages: {
          sessionsPerDay: parseFloat(averagePerDay),
          minutesPerDay: days > 0 ? Math.round(totalMinutes / days) : 0
        },
        streak: {
          current: currentStreak,
          unit: 'days'
        },
        mostProductiveDay,
        dailyBreakdown: sessionsByDate
      }
    });
  } catch (error) {
    console.error('Error fetching pomodoro statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};

// DELETE session
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const [result] = await pool.query(
      'DELETE FROM pomodoro_sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pomodoro session not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Pomodoro session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pomodoro session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pomodoro session'
    });
  }
};

// POST batch sync (for offline sync)
const batchSync = async (req, res) => {
  try {
    const { sessions, lastSyncTime, user_id = 'default_user' } = req.body;
    
    if (!Array.isArray(sessions)) {
      return res.status(400).json({
        success: false,
        error: 'Sessions must be an array'
      });
    }
    
    const results = {
      created: [],
      errors: []
    };
    
    // Process each session
    for (const session of sessions) {
      try {
        // Check if session already exists
        const [existing] = await pool.query(
          'SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?',
          [session.id, user_id]
        );
        
        if (existing.length === 0) {
          // Create new session
          await pool.query(
            `INSERT INTO pomodoro_sessions (id, minutes, completed_at, user_id) 
             VALUES (?, ?, ?, ?)`,
            [
              session.id,
              session.minutes,
              session.completed_at || new Date(),
              user_id
            ]
          );
          results.created.push(session.id);
        }
        // Note: We don't update existing sessions, only create new ones
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
        results.errors.push(session.id);
      }
    }
    
    // Get all sessions since last sync
    const [serverSessions] = await pool.query(
      'SELECT * FROM pomodoro_sessions WHERE user_id = ? AND completed_at > ? ORDER BY completed_at DESC',
      [user_id, lastSyncTime || '1970-01-01']
    );
    
    res.json({
      success: true,
      results,
      serverSessions,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in batch sync:', error);
    res.status(500).json({
      success: false,
      error: 'Batch sync failed'
    });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  logSession,
  getTodaySessions,
  getStatistics,
  deleteSession,
  batchSync
};