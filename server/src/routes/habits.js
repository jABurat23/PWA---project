const express = require('express');
const router = express.Router();
const habitsController = require('../controllers/habitsController');

// GET all habits
router.get('/', habitsController.getAllHabits);

// GET habit statistics (must be before /:id to avoid conflict)
router.get('/stats/summary', habitsController.getHabitStats);

// GET single habit by ID
router.get('/:id', habitsController.getHabitById);

// POST create new habit
router.post('/', habitsController.createHabit);

// PUT update habit
router.put('/:id', habitsController.updateHabit);

// POST complete habit (increment streak)
router.post('/:id/complete', habitsController.completeHabit);

// POST reset habit streak
router.post('/:id/reset', habitsController.resetStreak);

// DELETE habit (soft delete)
router.delete('/:id', habitsController.deleteHabit);

// POST batch sync (for offline sync)
router.post('/sync/batch', habitsController.batchSync);

module.exports = router;