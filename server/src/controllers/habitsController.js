// server/src/controllers/habitsController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper function to calculate streak
const calculateStreak = (lastCompleted, frequency) => {
  if (!lastCompleted) return 0;
  
  const now = new Date();
  const last = new Date(lastCompleted);
  const diffTime = Math.abs(now - last);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (frequency === 'daily') {
    // For daily habits, streak breaks after 1 day
    return diffDays <= 1 ? 1 : 0;
  } else if (frequency === 'weekly') {
    // For weekly habits, streak breaks after 7 days
    return diffDays <= 7 ? 1 : 0;
  }
  
  return 0;
};

// GET all habits
const getAllHabits = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const includeDeleted = req.query.include_deleted === 'true';
    const frequency = req.query.frequency; // 'daily' or 'weekly'
    
    let query = 'SELECT * FROM habits WHERE user_id = ?';
    const params = [userId];
    
    if (!includeDeleted) {
      query += ' AND deleted = FALSE';
    }
    
    if (frequency) {
      query += ' AND frequency = ?';
      params.push(frequency);
    }
    
    query += ' ORDER BY streak DESC, created_at DESC';
    
    const [habits] = await pool.query(query, params);
    
    res.json({
      success: true,
      count: habits.length,
      data: habits
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch habits'
    });
  }
};

// GET single habit by ID
const getHabitById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const [habits] = await pool.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (habits.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }
    
    res.json({
      success: true,
      data: habits[0]
    });
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch habit'
    });
  }
};

// POST create new habit
const createHabit = async (req, res) => {
  try {
    const {
      id = uuidv4(),
      name,
      frequency = 'daily',
      streak = 0,
      last_completed = null,
      user_id = 'default_user'
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Habit name is required'
      });
    }
    
    if (!['daily', 'weekly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Frequency must be "daily" or "weekly"'
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO habits (id, name, frequency, streak, last_completed, user_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, frequency, streak, last_completed, user_id]
    );
    
    // Fetch the created habit
    const [habits] = await pool.query('SELECT * FROM habits WHERE id = ?', [id]);
    
    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: habits[0]
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create habit'
    });
  }
};

// PUT update habit
const updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    const updates = req.body;
    
    // Check if habit exists
    const [existingHabits] = await pool.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingHabits.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }
    
    // Build update query dynamically
    const allowedFields = ['name', 'frequency', 'streak', 'last_completed', 'deleted'];
    const updateFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'frequency' && !['daily', 'weekly'].includes(updates[key])) {
          return; // Skip invalid frequency
        }
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    // Add updated_at
    updateFields.push('updated_at = NOW()');
    values.push(id, userId);
    
    await pool.query(
      `UPDATE habits SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    // Fetch updated habit
    const [habits] = await pool.query('SELECT * FROM habits WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Habit updated successfully',
      data: habits[0]
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update habit'
    });
  }
};

// POST complete habit (increment streak)
const completeHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    // Get current habit
    const [habits] = await pool.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (habits.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }
    
    const habit = habits[0];
    const now = new Date();
    
    // Check if already completed today/this week
    if (habit.last_completed) {
      const lastCompleted = new Date(habit.last_completed);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastDate = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
      
      if (habit.frequency === 'daily' && today.getTime() === lastDate.getTime()) {
        return res.status(400).json({
          success: false,
          error: 'Habit already completed today'
        });
      }
      
      if (habit.frequency === 'weekly') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        if (lastCompleted >= weekStart) {
          return res.status(400).json({
            success: false,
            error: 'Habit already completed this week'
          });
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
        // Consecutive day: increment, otherwise reset to 1
        newStreak = diffDays <= 1 ? habit.streak + 1 : 1;
      } else if (habit.frequency === 'weekly') {
        // Consecutive week: increment, otherwise reset to 1
        newStreak = diffDays <= 7 ? habit.streak + 1 : 1;
      }
    } else {
      // First time completing
      newStreak = 1;
    }
    
    // Update habit
    await pool.query(
      'UPDATE habits SET streak = ?, last_completed = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?',
      [newStreak, id, userId]
    );
    
    // Fetch updated habit
    const [updatedHabits] = await pool.query('SELECT * FROM habits WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Habit completed!',
      data: updatedHabits[0],
      streakIncreased: newStreak > habit.streak
    });
  } catch (error) {
    console.error('Error completing habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete habit'
    });
  }
};

// POST reset habit streak
const resetStreak = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const [result] = await pool.query(
      'UPDATE habits SET streak = 0, last_completed = NULL, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }
    
    // Fetch updated habit
    const [habits] = await pool.query('SELECT * FROM habits WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Habit streak reset',
      data: habits[0]
    });
  } catch (error) {
    console.error('Error resetting streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset streak'
    });
  }
};

// GET habit statistics
const getHabitStats = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    
    const [habits] = await pool.query(
      'SELECT * FROM habits WHERE user_id = ? AND deleted = FALSE',
      [userId]
    );
    
    const stats = {
      totalHabits: habits.length,
      dailyHabits: habits.filter(h => h.frequency === 'daily').length,
      weeklyHabits: habits.filter(h => h.frequency === 'weekly').length,
      activeStreaks: habits.filter(h => h.streak > 0).length,
      longestStreak: Math.max(...habits.map(h => h.streak), 0),
      averageStreak: habits.length > 0 
        ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) 
        : 0,
      completedToday: 0,
      completedThisWeek: 0
    };
    
    // Calculate completed today/this week
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    habits.forEach(habit => {
      if (habit.last_completed) {
        const lastCompleted = new Date(habit.last_completed);
        const lastDate = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
        
        if (habit.frequency === 'daily' && lastDate.getTime() === today.getTime()) {
          stats.completedToday++;
        }
        
        if (lastCompleted >= weekStart) {
          stats.completedThisWeek++;
        }
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching habit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch habit statistics'
    });
  }
};

// DELETE habit (soft delete)
const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    const hardDelete = req.query.hard === 'true';
    
    if (hardDelete) {
      // Hard delete (permanent)
      const [result] = await pool.query(
        'DELETE FROM habits WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Habit not found'
        });
      }
    } else {
      // Soft delete
      const [result] = await pool.query(
        'UPDATE habits SET deleted = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Habit not found'
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Habit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete habit'
    });
  }
};

// POST batch sync (for offline sync)
const batchSync = async (req, res) => {
  try {
    const { habits, lastSyncTime, user_id = 'default_user' } = req.body;
    
    if (!Array.isArray(habits)) {
      return res.status(400).json({
        success: false,
        error: 'Habits must be an array'
      });
    }
    
    const results = {
      created: [],
      updated: [],
      conflicts: []
    };
    
    // Process each habit
    for (const habit of habits) {
      try {
        // Check if habit exists
        const [existing] = await pool.query(
          'SELECT * FROM habits WHERE id = ? AND user_id = ?',
          [habit.id, user_id]
        );
        
        if (existing.length === 0) {
          // Create new habit
          await pool.query(
            `INSERT INTO habits (id, name, frequency, streak, last_completed, user_id, deleted) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              habit.id,
              habit.name,
              habit.frequency || 'daily',
              habit.streak || 0,
              habit.last_completed || null,
              user_id,
              habit.deleted || false
            ]
          );
          results.created.push(habit.id);
        } else {
          // Check for conflicts (server updated after client's last sync)
          const serverUpdatedAt = new Date(existing[0].updated_at);
          const clientLastSync = lastSyncTime ? new Date(lastSyncTime) : new Date(0);
          
          if (serverUpdatedAt > clientLastSync) {
            // Conflict detected - server wins
            results.conflicts.push({
              id: habit.id,
              serverData: existing[0]
            });
          } else {
            // Update habit
            await pool.query(
              `UPDATE habits 
               SET name = ?, frequency = ?, streak = ?, last_completed = ?, deleted = ?, updated_at = NOW()
               WHERE id = ? AND user_id = ?`,
              [
                habit.name,
                habit.frequency || 'daily',
                habit.streak || 0,
                habit.last_completed || null,
                habit.deleted || false,
                habit.id,
                user_id
              ]
            );
            results.updated.push(habit.id);
          }
        }
      } catch (error) {
        console.error(`Error processing habit ${habit.id}:`, error);
      }
    }
    
    // Get all habits updated since last sync
    const [serverHabits] = await pool.query(
      'SELECT * FROM habits WHERE user_id = ? AND updated_at > ?',
      [user_id, lastSyncTime || '1970-01-01']
    );
    
    res.json({
      success: true,
      results,
      serverHabits,
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
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  completeHabit,
  resetStreak,
  getHabitStats,
  deleteHabit,
  batchSync
};