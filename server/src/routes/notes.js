const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');

// GET all notes
router.get('/', notesController.getAllNotes);

// GET single note by ID
router.get('/:id', notesController.getNoteById);

// GET search notes
router.get('/search/query', notesController.searchNotes);

// POST create new note
router.post('/', notesController.createNote);

// PUT update note
router.put('/:id', notesController.updateNote);

// DELETE note (soft delete)
router.delete('/:id', notesController.deleteNote);

// POST batch sync (for offline sync)
router.post('/sync/batch', notesController.batchSync);

module.exports = router;
