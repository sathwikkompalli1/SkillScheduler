const Task = require('../models/Task');
const Skill = require('../models/Skill');
const User = require('../models/User');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            scheduledDate,
            scheduledTime,
            estimatedDuration,
            priority,
            skillId,
            resources,
            dayNumber,
            topicIndex
        } = req.body;

        const taskData = {
            user: req.user.id,
            title,
            description,
            type: type || 'learning',
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            estimatedDuration: estimatedDuration || 60,
            priority: priority || 1,
            resources: resources || [],
            dayNumber,
            topicIndex
        };

        if (skillId) {
            const skill = await Skill.findOne({ _id: skillId, user: req.user.id });
            if (skill) {
                taskData.skill = skillId;
            }
        }

        const task = await Task.create(taskData);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('CreateTask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get tasks for a specific date
// @route   GET /api/tasks/date/:date
// @access  Private
const getTasksByDate = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const tasks = await Task.getTasksForDate(req.user.id, date);

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('GetTasksByDate error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get today's tasks
// @route   GET /api/tasks/today
// @access  Private
const getTodayTasks = async (req, res) => {
    try {
        const today = new Date();
        const tasks = await Task.getTasksForDate(req.user.id, today);

        // Add workout task if enabled
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('GetTodayTasks error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
const getAllTasks = async (req, res) => {
    try {
        const { status, type, skillId, startDate, endDate } = req.query;

        let query = { user: req.user.id };

        if (status) query.status = status;
        if (type) query.type = type;
        if (skillId) query.skill = skillId;

        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) query.scheduledDate.$gte = new Date(startDate);
            if (endDate) query.scheduledDate.$lte = new Date(endDate);
        }

        const tasks = await Task.find(query)
            .populate('skill', 'name')
            .sort({ scheduledDate: 1, 'scheduledTime.startTime': 1 });

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('GetAllTasks error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user.id })
            .populate('skill', 'name');

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('GetTask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        let task = await Task.findOne({ _id: req.params.id, user: req.user.id });

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const allowedUpdates = [
            'title', 'description', 'scheduledDate', 'scheduledTime',
            'estimatedDuration', 'priority', 'status', 'notes', 'resources'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                task[field] = req.body[field];
            }
        });

        await task.save();

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('UpdateTask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Mark task as complete
// @route   PUT /api/tasks/:id/complete
// @access  Private
const completeTask = async (req, res) => {
    try {
        let task = await Task.findOne({ _id: req.params.id, user: req.user.id });

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await task.markComplete();

        // Update skill progress if linked to a skill
        if (task.skill) {
            const skill = await Skill.findById(task.skill);
            if (skill && task.topicIndex !== undefined) {
                skill.dailyTopics[task.topicIndex].completed = true;
                skill.progress = skill.calculateProgress();
                if (skill.progress === 100) {
                    skill.status = 'completed';
                } else if (skill.progress > 0) {
                    skill.status = 'in_progress';
                }
                await skill.save();
            }
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('CompleteTask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get missed tasks
// @route   GET /api/tasks/missed
// @access  Private
const getMissedTasks = async (req, res) => {
    try {
        const tasks = await Task.getMissedTasks(req.user.id);

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('GetMissedTasks error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reschedule task
// @route   PUT /api/tasks/:id/reschedule
// @access  Private
const rescheduleTask = async (req, res) => {
    try {
        const { newDate } = req.body;

        let task = await Task.findOne({ _id: req.params.id, user: req.user.id });

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await task.reschedule(new Date(newDate));

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('RescheduleTask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await task.deleteOne();

        res.json({
            success: true,
            message: 'Task deleted'
        });
    } catch (error) {
        console.error('DeleteTask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Bulk create tasks
// @route   POST /api/tasks/bulk
// @access  Private
const bulkCreateTasks = async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ success: false, message: 'Tasks array is required' });
        }

        const tasksToCreate = tasks.map(task => ({
            ...task,
            user: req.user.id,
            scheduledDate: new Date(task.scheduledDate)
        }));

        const createdTasks = await Task.insertMany(tasksToCreate);

        res.status(201).json({
            success: true,
            count: createdTasks.length,
            data: createdTasks
        });
    } catch (error) {
        console.error('BulkCreateTasks error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
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
};
