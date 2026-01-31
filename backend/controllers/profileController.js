const User = require('../models/User');
const Task = require('../models/Task');
const { rescheduleOnTimeChange } = require('../services/aiReplanner');

// @desc    Update user profile (onboarding)
// @route   PUT /api/profile/onboard
// @access  Private
const updateOnboarding = async (req, res) => {
    try {
        const {
            dailyLearningHours,
            freeTimeSlots,
            sleepTime,
            wakeTime,
            workoutEnabled,
            workoutPreference,
            existingSkills
        } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update profile
        user.profile = {
            dailyLearningHours: dailyLearningHours || user.profile.dailyLearningHours,
            freeTimeSlots: freeTimeSlots || user.profile.freeTimeSlots,
            sleepTime: sleepTime || user.profile.sleepTime,
            wakeTime: wakeTime || user.profile.wakeTime,
            workoutEnabled: workoutEnabled !== undefined ? workoutEnabled : user.profile.workoutEnabled,
            workoutPreference: workoutPreference || user.profile.workoutPreference,
            existingSkills: existingSkills || user.profile.existingSkills
        };

        user.isOnboarded = true;
        await user.save();

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isOnboarded: user.isOnboarded,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('GetProfile error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const {
            name,
            dailyLearningHours,
            freeTimeSlots,
            sleepTime,
            wakeTime,
            workoutEnabled,
            workoutPreference,
            existingSkills
        } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if dailyLearningHours is changing
        const oldDailyHours = user.profile.dailyLearningHours;
        const newDailyHours = dailyLearningHours !== undefined ? dailyLearningHours : oldDailyHours;
        const hoursChanged = dailyLearningHours !== undefined && dailyLearningHours !== oldDailyHours;

        // Check if workout is being disabled
        const oldWorkoutEnabled = user.profile.workoutEnabled;
        const workoutDisabled = workoutEnabled === false && oldWorkoutEnabled === true;

        if (name) user.name = name;

        if (dailyLearningHours !== undefined) user.profile.dailyLearningHours = dailyLearningHours;
        if (freeTimeSlots) user.profile.freeTimeSlots = freeTimeSlots;
        if (sleepTime) user.profile.sleepTime = sleepTime;
        if (wakeTime) user.profile.wakeTime = wakeTime;
        if (workoutEnabled !== undefined) user.profile.workoutEnabled = workoutEnabled;
        if (workoutPreference) user.profile.workoutPreference = workoutPreference;
        if (existingSkills) user.profile.existingSkills = existingSkills;

        await user.save();

        // If daily hours changed, reschedule all pending tasks
        let rescheduleResult = null;
        if (hoursChanged) {
            rescheduleResult = await rescheduleOnTimeChange(req.user.id, newDailyHours);
        }

        // If workout was disabled, delete all pending workout tasks
        let deletedWorkoutTasks = 0;
        if (workoutDisabled) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = await Task.deleteMany({
                user: req.user.id,
                type: 'workout',
                status: { $in: ['pending', 'rescheduled'] },
                scheduledDate: { $gte: today }
            });
            deletedWorkoutTasks = result.deletedCount;
        }

        res.json({
            success: true,
            data: user,
            rescheduled: rescheduleResult,
            deletedWorkoutTasks: deletedWorkoutTasks
        });
    } catch (error) {
        console.error('UpdateProfile error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { updateOnboarding, getProfile, updateProfile };

