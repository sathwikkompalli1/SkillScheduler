const Skill = require('../models/Skill');
const Task = require('../models/Task');
const User = require('../models/User');
const { generateLearningPlan, generateDailyTopics, generateYouTubeQueries } = require('../services/aiPlanner');
const { replanMissedTasks, replanSkillTasks, generateWorkoutTasks, rescheduleOnTimeChange } = require('../services/aiReplanner');

// @desc    Generate learning plan for a skill using AI
// @route   POST /api/ai/generate-plan/:skillId
// @access  Private
const generatePlan = async (req, res) => {
    try {
        const skill = await Skill.findOne({ _id: req.params.skillId, user: req.user.id });

        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }

        const user = await User.findById(req.user.id);
        const dailyLearningHours = user.profile.dailyLearningHours || 2;

        // Get all active/in_progress skills for this user (including the current one we're generating for)
        const activeSkills = await Skill.find({
            user: req.user.id,
            status: { $in: ['in_progress', 'not_started'] }
        });

        // Calculate how many skills will share the daily time
        // This includes the current skill we're generating a plan for
        const totalActiveSkills = activeSkills.length || 1;

        // Divide available hours equally among active skills
        // Ensure at least 0.5 hours per skill minimum
        const availableHoursPerSkill = Math.max(0.5, dailyLearningHours / totalActiveSkills);

        // Check if there's enough time for this skill
        if (availableHoursPerSkill < 0.5) {
            return res.status(400).json({
                success: false,
                message: `Not enough daily time available. You have ${dailyLearningHours} hours for ${totalActiveSkills} skills. Consider increasing your daily learning hours in your profile or pausing some skills.`
            });
        }

        // Generate complete learning plan with time constraint
        const { dailyTopics, tasks } = await generateLearningPlan({
            skill,
            user,
            availableHoursPerSkill
        });

        // Update skill with daily topics
        skill.dailyTopics = dailyTopics.map((topic, index) => ({
            day: topic.day,
            topic: topic.topic,
            description: topic.description,
            estimatedHours: topic.estimatedHours,
            completed: false
        }));
        skill.status = 'in_progress';
        await skill.save();

        // Create tasks in database
        const tasksToCreate = tasks.map(task => ({
            ...task,
            user: req.user.id
        }));

        // Delete existing tasks for this skill
        await Task.deleteMany({ skill: skill._id, user: req.user.id });

        // Create new tasks
        const createdTasks = await Task.insertMany(tasksToCreate);

        // Generate workout tasks if enabled
        let workoutTasks = [];
        if (user.profile.workoutEnabled) {
            workoutTasks = await generateWorkoutTasks(req.user.id, skill.startDate, skill.targetDays);
        }

        // Reschedule OTHER active skills to share time with this new skill
        // This is needed when adding a 2nd, 3rd, etc. skill mid-learning
        let rescheduleResult = null;
        if (totalActiveSkills > 1) {
            // Reschedule all active skills (including the current one) but exclude newly created tasks
            rescheduleResult = await rescheduleOnTimeChange(req.user.id, dailyLearningHours);
        }

        res.json({
            success: true,
            data: {
                skill,
                tasksCreated: createdTasks.length,
                workoutTasksCreated: workoutTasks.length,
                dailyTopics,
                hoursPerSkill: availableHoursPerSkill,
                activeSkillsCount: totalActiveSkills,
                otherSkillsRescheduled: rescheduleResult
            }
        });
    } catch (error) {
        console.error('GeneratePlan error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Replan missed tasks
// @route   POST /api/ai/replan
// @access  Private
const replan = async (req, res) => {
    try {
        const { skillId } = req.body;

        const result = await replanMissedTasks(req.user.id, skillId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Replan error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Replan specific skill
// @route   POST /api/ai/replan-skill/:skillId
// @access  Private
const replanSkill = async (req, res) => {
    try {
        const result = await replanSkillTasks(req.params.skillId, req.user.id);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('ReplanSkill error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get YouTube resources for a topic
// @route   POST /api/ai/resources
// @access  Private
const getResources = async (req, res) => {
    try {
        const { topic, skillName } = req.body;

        if (!topic) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }

        const resources = await generateYouTubeQueries(topic, skillName || '');

        res.json({
            success: true,
            data: resources
        });
    } catch (error) {
        console.error('GetResources error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Generate topics preview (without creating tasks)
// @route   POST /api/ai/preview-topics
// @access  Private
const previewTopics = async (req, res) => {
    try {
        const { skillName, targetDays } = req.body;
        const user = await User.findById(req.user.id);

        if (!skillName || !targetDays) {
            return res.status(400).json({ success: false, message: 'Skill name and target days are required' });
        }

        const dailyTopics = await generateDailyTopics({
            skillName,
            targetDays,
            dailyHours: user.profile.dailyLearningHours,
            existingSkills: user.profile.existingSkills
        });

        res.json({
            success: true,
            data: dailyTopics
        });
    } catch (error) {
        console.error('PreviewTopics error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    generatePlan,
    replan,
    replanSkill,
    getResources,
    previewTopics
};
