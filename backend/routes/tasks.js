const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasksByDate,
    getTodayTasks,
    getAllTasks,
    getTask,
    updateTask,
    completeTask,
    getMissedTasks,
    rescheduleTask,
    deleteTask,
    bulkCreateTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getAllTasks)
    .post(protect, createTask);

router.post('/bulk', protect, bulkCreateTasks);
router.get('/today', protect, getTodayTasks);
router.get('/missed', protect, getMissedTasks);
router.get('/date/:date', protect, getTasksByDate);

router.route('/:id')
    .get(protect, getTask)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

router.put('/:id/complete', protect, completeTask);
router.put('/:id/reschedule', protect, rescheduleTask);

module.exports = router;
