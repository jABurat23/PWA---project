const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');

// GET all tasks
router.get('/', tasksController.getAllTasks);

// GET single task by ID
router.get('/:id', tasksController.getTaskById);

// POST create new task
router.post('/', tasksController.createTask);

// PUT update task
router.put('/:id', tasksController.updateTask);

// DELETE task (soft delete)
router.delete('/:id', tasksController.deleteTask);

// POST batch sync (for offline sync)
router.post('/sync/batch', tasksController.batchSync);

module.exports = router;