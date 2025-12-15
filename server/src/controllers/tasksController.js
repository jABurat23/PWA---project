const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET all tasks
const getAllTasks = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const includeDeleted = req.query.include_deleted === 'true';
    
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    if (!includeDeleted) {
      query += ' AND deleted = FALSE';
    }
    query += ' ORDER BY created_at DESC';
    
    const [tasks] = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
};

// GET single task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      data: tasks[0]
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
};

// POST create new task
const createTask = async (req, res) => {
  try {
    const {
      id = uuidv4(),
      title,
      description = '',
      priority = 'medium',
      deadline = null,
      completed = false,
      user_id = 'default_user'
    } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO tasks (id, title, description, priority, deadline, completed, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description, priority, deadline, completed, user_id]
    );
    
    // Fetch the created task
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: tasks[0]
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
};

// PUT update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    const updates = req.body;
    
    // Check if task exists
    const [existingTasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingTasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Build update query dynamically
    const allowedFields = ['title', 'description', 'priority', 'deadline', 'completed', 'deleted'];
    const updateFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
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
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    // Fetch updated task
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: tasks[0]
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
};

// DELETE task (soft delete)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    const hardDelete = req.query.hard === 'true';
    
    if (hardDelete) {
      // Hard delete (permanent)
      const [result] = await pool.query(
        'DELETE FROM tasks WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
    } else {
      // Soft delete
      const [result] = await pool.query(
        'UPDATE tasks SET deleted = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
};

// POST batch sync (for offline sync)
const batchSync = async (req, res) => {
  try {
    const { tasks, lastSyncTime, user_id = 'default_user' } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'Tasks must be an array'
      });
    }
    
    const results = {
      created: [],
      updated: [],
      conflicts: []
    };
    
    // Process each task
    for (const task of tasks) {
      try {
        // Check if task exists
        const [existing] = await pool.query(
          'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
          [task.id, user_id]
        );
        
        if (existing.length === 0) {
          // Create new task
          await pool.query(
            `INSERT INTO tasks (id, title, description, priority, deadline, completed, user_id, deleted) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              task.id,
              task.title,
              task.description || '',
              task.priority || 'medium',
              task.deadline || null,
              task.completed || false,
              user_id,
              task.deleted || false
            ]
          );
          results.created.push(task.id);
        } else {
          // Check for conflicts (server updated after client's last sync)
          const serverUpdatedAt = new Date(existing[0].updated_at);
          const clientLastSync = lastSyncTime ? new Date(lastSyncTime) : new Date(0);
          
          if (serverUpdatedAt > clientLastSync) {
            // Conflict detected - server wins
            results.conflicts.push({
              id: task.id,
              serverData: existing[0]
            });
          } else {
            // Update task
            await pool.query(
              `UPDATE tasks 
               SET title = ?, description = ?, priority = ?, deadline = ?, 
                   completed = ?, deleted = ?, updated_at = NOW()
               WHERE id = ? AND user_id = ?`,
              [
                task.title,
                task.description || '',
                task.priority || 'medium',
                task.deadline || null,
                task.completed || false,
                task.deleted || false,
                task.id,
                user_id
              ]
            );
            results.updated.push(task.id);
          }
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
      }
    }
    
    // Get all tasks updated since last sync
    const [serverTasks] = await pool.query(
      'SELECT * FROM tasks WHERE user_id = ? AND updated_at > ?',
      [user_id, lastSyncTime || '1970-01-01']
    );
    
    res.json({
      success: true,
      results,
      serverTasks,
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
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  batchSync
};