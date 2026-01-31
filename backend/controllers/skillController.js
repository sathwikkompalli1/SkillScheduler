const Skill = require('../models/Skill');
const Task = require('../models/Task');
const User = require('../models/User');
const { rescheduleOnTimeChange } = require('../services/aiReplanner');

// @desc    Create a new skill
// @route   POST /api/skills
// @access  Private
const createSkill = async (req, res) => {
    try {
        const { name, description, targetDays, priority, startDate } = req.body;

        const skill = await Skill.create({
            user: req.user.id,
            name,
            description,
            targetDays,
            priority: priority || 1,
            startDate: startDate || new Date(),
            status: 'not_started'
        });

        res.status(201).json({
            success: true,
            data: skill
        });
    } catch (error) {
        console.error('CreateSkill error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all skills for user
// @route   GET /api/skills
// @access  Private
const getSkills = async (req, res) => {
    try {
        const skills = await Skill.find({ user: req.user.id }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: skills.length,
            data: skills
        });
    } catch (error) {
        console.error('GetSkills error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get single skill
// @route   GET /api/skills/:id
// @access  Private
const getSkill = async (req, res) => {
    try {
        const skill = await Skill.findOne({ _id: req.params.id, user: req.user.id });

        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }

        res.json({
            success: true,
            data: skill
        });
    } catch (error) {
        console.error('GetSkill error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private
const updateSkill = async (req, res) => {
    try {
        let skill = await Skill.findOne({ _id: req.params.id, user: req.user.id });

        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }

        const { name, description, targetDays, priority, status } = req.body;

        if (name) skill.name = name;
        if (description) skill.description = description;
        if (targetDays) skill.targetDays = targetDays;
        if (priority) skill.priority = priority;
        if (status) skill.status = status;

        await skill.save();

        res.json({
            success: true,
            data: skill
        });
    } catch (error) {
        console.error('UpdateSkill error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
const deleteSkill = async (req, res) => {
    try {
        const skill = await Skill.findOne({ _id: req.params.id, user: req.user.id });

        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }

        // Delete associated tasks
        await Task.deleteMany({ skill: skill._id });

        await skill.deleteOne();

        // Reschedule remaining skills to use the freed-up time
        const user = await User.findById(req.user.id);
        const dailyHours = user.profile.dailyLearningHours || 2;
        const rescheduleResult = await rescheduleOnTimeChange(req.user.id, dailyHours);

        res.json({
            success: true,
            message: 'Skill deleted',
            rescheduled: rescheduleResult
        });
    } catch (error) {
        console.error('DeleteSkill error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update skill progress
// @route   PUT /api/skills/:id/progress
// @access  Private
const updateSkillProgress = async (req, res) => {
    try {
        const skill = await Skill.findOne({ _id: req.params.id, user: req.user.id });

        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }

        skill.progress = skill.calculateProgress();

        // Update status based on progress
        if (skill.progress === 100) {
            skill.status = 'completed';
        } else if (skill.progress > 0) {
            skill.status = 'in_progress';
        }

        await skill.save();

        res.json({
            success: true,
            data: skill
        });
    } catch (error) {
        console.error('UpdateSkillProgress error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    createSkill,
    getSkills,
    getSkill,
    updateSkill,
    deleteSkill,
    updateSkillProgress
};
