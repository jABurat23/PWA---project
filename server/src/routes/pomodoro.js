// server/src/routes/pomodoro.js
const express = require('express');
const router = express.Router();
const pomodoroController = require('../controllers/pomodoroController');

// GET all sessions
router.get('/logs', pomodoroController.getAllSessions);

// GET today's sessions
router.get('/today', pomodoroController.getTodaySessions);

// GET statistics
router.get('/stats', pomodoroController.getStatistics);

// GET single session by ID
router.get('/logs/:id', pomodoroController.getSessionById);

// POST log new session
router.post('/log', pomodoroController.logSession);

// DELETE session
router.delete('/logs/:id', pomodoroController.deleteSession);

// POST batch sync (for offline sync)
router.post('/sync/batch', pomodoroController.batchSync);

module.exports = router;