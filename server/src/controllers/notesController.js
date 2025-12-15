const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET all notes
const getAllNotes = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const includeDeleted = req.query.include_deleted === 'true';
    const pinnedOnly = req.query.pinned === 'true';
    const tag = req.query.tag;
    
    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [userId];
    
    if (!includeDeleted) {
      query += ' AND deleted = FALSE';
    }
    
    if (pinnedOnly) {
      query += ' AND pinned = TRUE';
    }
    
    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }
    
    query += ' ORDER BY pinned DESC, updated_at DESC';
    
    const [notes] = await pool.query(query, params);
    
    // Parse tags from JSON string
    const notesWithParsedTags = notes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }));
    
    res.json({
      success: true,
      count: notesWithParsedTags.length,
      data: notesWithParsedTags
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
};

// GET single note by ID
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    
    const [notes] = await pool.query(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    const note = {
      ...notes[0],
      tags: notes[0].tags ? JSON.parse(notes[0].tags) : []
    };
    
    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note'
    });
  }
};

// GET search notes
const searchNotes = async (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const searchQuery = req.query.q || '';
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const searchPattern = `%${searchQuery}%`;
    
    const [notes] = await pool.query(
      `SELECT * FROM notes 
       WHERE user_id = ? 
       AND deleted = FALSE 
       AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
       ORDER BY pinned DESC, updated_at DESC`,
      [userId, searchPattern, searchPattern, searchPattern]
    );
    
    const notesWithParsedTags = notes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }));
    
    res.json({
      success: true,
      count: notesWithParsedTags.length,
      data: notesWithParsedTags,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search notes'
    });
  }
};

// POST create new note
const createNote = async (req, res) => {
  try {
    const {
      id = uuidv4(),
      title,
      content = '',
      tags = [],
      pinned = false,
      user_id = 'default_user'
    } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    // Convert tags array to JSON string
    const tagsJson = JSON.stringify(tags);
    
    const [result] = await pool.query(
      `INSERT INTO notes (id, title, content, tags, pinned, user_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, content, tagsJson, pinned, user_id]
    );
    
    // Fetch the created note
    const [notes] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
    
    const note = {
      ...notes[0],
      tags: notes[0].tags ? JSON.parse(notes[0].tags) : []
    };
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
};

// PUT update note
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    const updates = req.body;
    
    // Check if note exists
    const [existingNotes] = await pool.query(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingNotes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // Build update query dynamically
    const allowedFields = ['title', 'content', 'tags', 'pinned', 'deleted'];
    const updateFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        // Convert tags array to JSON string if needed
        if (key === 'tags' && Array.isArray(updates[key])) {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
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
      `UPDATE notes SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    // Fetch updated note
    const [notes] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
    
    const note = {
      ...notes[0],
      tags: notes[0].tags ? JSON.parse(notes[0].tags) : []
    };
    
    res.json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note'
    });
  }
};

// DELETE note (soft delete)
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id || 'default_user';
    const hardDelete = req.query.hard === 'true';
    
    if (hardDelete) {
      // Hard delete (permanent)
      const [result] = await pool.query(
        'DELETE FROM notes WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
    } else {
      // Soft delete
      const [result] = await pool.query(
        'UPDATE notes SET deleted = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
};

// POST batch sync (for offline sync)
const batchSync = async (req, res) => {
  try {
    const { notes, lastSyncTime, user_id = 'default_user' } = req.body;
    
    if (!Array.isArray(notes)) {
      return res.status(400).json({
        success: false,
        error: 'Notes must be an array'
      });
    }
    
    const results = {
      created: [],
      updated: [],
      conflicts: []
    };
    
    // Process each note
    for (const note of notes) {
      try {
        // Check if note exists
        const [existing] = await pool.query(
          'SELECT * FROM notes WHERE id = ? AND user_id = ?',
          [note.id, user_id]
        );
        
        const tagsJson = Array.isArray(note.tags) ? JSON.stringify(note.tags) : note.tags;
        
        if (existing.length === 0) {
          // Create new note
          await pool.query(
            `INSERT INTO notes (id, title, content, tags, pinned, user_id, deleted) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              note.id,
              note.title,
              note.content || '',
              tagsJson || '[]',
              note.pinned || false,
              user_id,
              note.deleted || false
            ]
          );
          results.created.push(note.id);
        } else {
          // Check for conflicts (server updated after client's last sync)
          const serverUpdatedAt = new Date(existing[0].updated_at);
          const clientLastSync = lastSyncTime ? new Date(lastSyncTime) : new Date(0);
          
          if (serverUpdatedAt > clientLastSync) {
            // Conflict detected - server wins
            results.conflicts.push({
              id: note.id,
              serverData: {
                ...existing[0],
                tags: existing[0].tags ? JSON.parse(existing[0].tags) : []
              }
            });
          } else {
            // Update note
            await pool.query(
              `UPDATE notes 
               SET title = ?, content = ?, tags = ?, pinned = ?, deleted = ?, updated_at = NOW()
               WHERE id = ? AND user_id = ?`,
              [
                note.title,
                note.content || '',
                tagsJson || '[]',
                note.pinned || false,
                note.deleted || false,
                note.id,
                user_id
              ]
            );
            results.updated.push(note.id);
          }
        }
      } catch (error) {
        console.error(`Error processing note ${note.id}:`, error);
      }
    }
    
    // Get all notes updated since last sync
    const [serverNotes] = await pool.query(
      'SELECT * FROM notes WHERE user_id = ? AND updated_at > ?',
      [user_id, lastSyncTime || '1970-01-01']
    );
    
    const notesWithParsedTags = serverNotes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }));
    
    res.json({
      success: true,
      results,
      serverNotes: notesWithParsedTags,
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
  getAllNotes,
  getNoteById,
  searchNotes,
  createNote,
  updateNote,
  deleteNote,
  batchSync
};