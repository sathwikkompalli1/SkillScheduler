const Task = require('../models/Task');
const Skill = require('../models/Skill');
const User = require('../models/User');

/**
 * Detect and mark missed tasks
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of missed tasks
 */
const detectMissedTasks = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const missedTasks = await Task.find({
        user: userId,
        scheduledDate: { $lt: today },
        status: 'pending'
    });

    // Mark tasks as missed
    for (const task of missedTasks) {
        task.status = 'missed';
        if (!task.originalDate) {
            task.originalDate = task.scheduledDate;
        }
        await task.save();
    }

    return missedTasks;
};

/**
 * Calculate available hours for a specific date
 * @param {Object} userProfile - User profile with time preferences
 * @param {Date} date - Date to calculate for
 * @param {Array} existingTasks - Existing tasks on that date
 * @returns {number} Available hours
 */
const calculateAvailableHours = async (userId, date) => {
    const user = await User.findById(userId);
    const tasks = await Task.getTasksForDate(userId, date);

    const totalScheduled = tasks.reduce((sum, task) => sum + (task.estimatedDuration || 60), 0);
    const availableMinutes = (user.profile.dailyLearningHours * 60) - totalScheduled;

    return Math.max(0, availableMinutes / 60);
};

/**
 * Find next available slot for a task
 * @param {string} userId - User ID
 * @param {number} requiredMinutes - Minutes needed for the task
 * @param {Date} startFrom - Start searching from this date
 * @returns {Promise<Date>} Next available date
 */
const findNextAvailableSlot = async (userId, requiredMinutes, startFrom = new Date()) => {
    const user = await User.findById(userId);
    let currentDate = new Date(startFrom);
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

    const maxDaysToSearch = 30;

    for (let i = 0; i < maxDaysToSearch; i++) {
        const availableHours = await calculateAvailableHours(userId, currentDate);
        const requiredHours = requiredMinutes / 60;

        if (availableHours >= requiredHours) {
            return currentDate;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // If no slot found within max days, return the next day anyway
    return new Date(startFrom.getTime() + 24 * 60 * 60 * 1000);
};

/**
 * Redistribute missed tasks across remaining days
 * @param {string} userId - User ID
 * @param {string} skillId - Optional skill ID to filter by
 * @returns {Promise<Object>} Replanning results
 */
const replanMissedTasks = async (userId, skillId = null) => {
    // First, detect and mark missed tasks
    await detectMissedTasks(userId);

    // Get all missed tasks
    let query = {
        user: userId,
        status: 'missed'
    };

    if (skillId) {
        query.skill = skillId;
    }

    const missedTasks = await Task.find(query).sort({ scheduledDate: 1 });

    if (missedTasks.length === 0) {
        return {
            success: true,
            message: 'No missed tasks to replan',
            rescheduledCount: 0
        };
    }

    const rescheduledTasks = [];
    let currentDate = new Date();

    for (const task of missedTasks) {
        const nextSlot = await findNextAvailableSlot(
            userId,
            task.estimatedDuration || 60,
            currentDate
        );

        if (!task.originalDate) {
            task.originalDate = task.scheduledDate;
        }
        task.scheduledDate = nextSlot;
        task.status = 'rescheduled';
        task.rescheduledCount += 1;
        await task.save();

        rescheduledTasks.push({
            taskId: task._id,
            title: task.title,
            originalDate: task.originalDate,
            newDate: nextSlot
        });

        currentDate = nextSlot;
    }

    return {
        success: true,
        message: `Rescheduled ${rescheduledTasks.length} tasks`,
        rescheduledCount: rescheduledTasks.length,
        tasks: rescheduledTasks
    };
};

/**
 * Auto-replan for a specific skill based on remaining days and topics
 * @param {string} skillId - Skill ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Replanning results
 */
const replanSkillTasks = async (skillId, userId) => {
    const skill = await Skill.findOne({ _id: skillId, user: userId });
    if (!skill) {
        return { success: false, message: 'Skill not found' };
    }

    const user = await User.findById(userId);
    const { dailyLearningHours } = user.profile;

    // Get incomplete topics from the skill
    const incompleteTopics = skill.dailyTopics.filter(t => !t.completed);

    if (incompleteTopics.length === 0) {
        return {
            success: true,
            message: 'All topics are completed',
            rescheduledCount: 0
        };
    }

    // Get pending/missed tasks for this skill
    const tasksToReplan = await Task.find({
        skill: skillId,
        user: userId,
        status: { $in: ['pending', 'missed', 'rescheduled'] }
    }).sort({ dayNumber: 1 });

    // Redistribute tasks starting from tomorrow
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() + 1);

    const rescheduledTasks = [];

    for (const task of tasksToReplan) {
        const nextSlot = await findNextAvailableSlot(
            userId,
            task.estimatedDuration || 60,
            currentDate
        );

        if (!task.originalDate) {
            task.originalDate = task.scheduledDate;
        }
        task.scheduledDate = nextSlot;
        task.status = 'rescheduled';
        task.rescheduledCount += 1;
        await task.save();

        rescheduledTasks.push({
            taskId: task._id,
            title: task.title,
            newDate: nextSlot
        });

        currentDate = nextSlot;
    }

    // Update skill end date
    if (rescheduledTasks.length > 0) {
        const lastTaskDate = rescheduledTasks[rescheduledTasks.length - 1].newDate;
        skill.endDate = lastTaskDate;
        await skill.save();
    }

    return {
        success: true,
        message: `Replanned ${rescheduledTasks.length} tasks`,
        rescheduledCount: rescheduledTasks.length,
        tasks: rescheduledTasks,
        newEndDate: skill.endDate
    };
};

/**
 * Generate workout tasks for a user
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for workout tasks
 * @param {number} days - Number of days to generate for
 * @returns {Promise<Array>} Created workout tasks
 */
const generateWorkoutTasks = async (userId, startDate, days) => {
    const user = await User.findById(userId);

    if (!user.profile.workoutEnabled) {
        return [];
    }

    const workoutTime = user.profile.workoutPreference === 'morning'
        ? { startTime: '07:00', endTime: '08:00' }
        : { startTime: '18:00', endTime: '19:00' };

    const workoutTasks = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < days; i++) {
        workoutTasks.push({
            user: userId,
            title: 'Daily Workout',
            description: 'Complete your daily exercise routine',
            type: 'workout',
            scheduledDate: new Date(currentDate),
            scheduledTime: workoutTime,
            estimatedDuration: 60,
            priority: 2,
            resources: [
                {
                    title: 'Full Body Workout for Students',
                    url: 'https://www.youtube.com/results?search_query=quick+workout+for+students',
                    type: 'youtube'
                }
            ]
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    const createdTasks = await Task.insertMany(workoutTasks);
    return createdTasks;
};

/**
 * Smart reschedule all pending tasks when user changes their daily learning hours
 * Allocates time based on topic importance and ensures 100% time utilization
 * @param {string} userId - User ID
 * @param {number} newDailyHours - New daily learning hours
 * @returns {Promise<Object>} Rescheduling results
 */
const rescheduleOnTimeChange = async (userId, newDailyHours) => {
    const user = await User.findById(userId);

    // Get all active skills for this user
    const activeSkills = await Skill.find({
        user: userId,
        status: 'in_progress'
    });

    if (activeSkills.length === 0) {
        return {
            success: true,
            message: 'No active skills to reschedule',
            rescheduledCount: 0
        };
    }

    const totalDailyMinutes = newDailyHours * 60;
    const minutesPerSkill = totalDailyMinutes / activeSkills.length;

    // Get today's date at midnight UTC (MongoDB stores dates in UTC)
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

    let totalRescheduled = 0;
    let allTasks = [];

    // Collect ALL pending tasks across all skills (including past dates)
    // This ensures tasks that were scheduled in the past but not completed are also redistributed
    for (const skill of activeSkills) {
        const pendingTasks = await Task.find({
            skill: skill._id,
            user: userId,
            status: { $in: ['pending', 'rescheduled', 'missed'] },
            type: 'learning'
        }).sort({ dayNumber: 1, importance: -1 });

        for (const task of pendingTasks) {
            allTasks.push({
                task,
                skillId: skill._id.toString(),
                skillName: skill.name
            });
        }
    }

    if (allTasks.length === 0) {
        return {
            success: true,
            message: 'No pending tasks to reschedule',
            rescheduledCount: 0
        };
    }

    // Sort all tasks by importance (high first), then by dayNumber
    allTasks.sort((a, b) => {
        const impDiff = (b.task.importance || 3) - (a.task.importance || 3);
        if (impDiff !== 0) return impDiff;
        return (a.task.dayNumber || 0) - (b.task.dayNumber || 0);
    });

    // Group tasks by skill for balanced distribution
    const tasksBySkill = {};
    for (const item of allTasks) {
        if (!tasksBySkill[item.skillId]) {
            tasksBySkill[item.skillId] = [];
        }
        tasksBySkill[item.skillId].push(item.task);
    }

    const skillIds = Object.keys(tasksBySkill);
    const taskPointers = {};
    skillIds.forEach(id => taskPointers[id] = 0);

    // Schedule tasks day by day
    let currentDate = new Date(today);
    let dayCount = 0;
    const maxDays = 365;

    while (dayCount < maxDays) {
        let anyTaskScheduled = false;

        // For each skill, schedule tasks for this day
        for (const skillId of skillIds) {
            const tasks = tasksBySkill[skillId];
            let skillMinutesUsed = 0;

            while (taskPointers[skillId] < tasks.length && skillMinutesUsed < minutesPerSkill) {
                const task = tasks[taskPointers[skillId]];
                const originalDuration = task.estimatedDuration || 60;
                const taskMinutes = Math.min(originalDuration, minutesPerSkill);
                const remainingMinutes = minutesPerSkill - skillMinutesUsed;

                if (taskMinutes <= remainingMinutes) {
                    // Task fits - schedule it
                    const oldDate = task.scheduledDate;
                    const oldDuration = task.estimatedDuration;
                    task.scheduledDate = new Date(currentDate);
                    task.estimatedDuration = taskMinutes;

                    // Check if date OR duration changed
                    const dateChanged = oldDate.getTime() !== task.scheduledDate.getTime();
                    const durationChanged = oldDuration !== taskMinutes;

                    if (dateChanged || durationChanged) {
                        if (!task.originalDate) task.originalDate = oldDate;
                        task.status = 'rescheduled';
                        task.rescheduledCount += 1;
                        totalRescheduled++;
                    }

                    await task.save();
                    skillMinutesUsed += taskMinutes;
                    taskPointers[skillId]++;
                    anyTaskScheduled = true;
                } else if (task.isSplittable && remainingMinutes >= 15) {
                    // Split the task
                    const oldDate = task.scheduledDate;
                    task.scheduledDate = new Date(currentDate);
                    const origDuration = task.estimatedDuration;
                    task.estimatedDuration = remainingMinutes;

                    if (!task.originalDate) task.originalDate = oldDate;
                    task.status = 'rescheduled';
                    task.rescheduledCount += 1;
                    totalRescheduled++;

                    await task.save();

                    // Create continuation for remaining time
                    const remainingTaskMinutes = origDuration - remainingMinutes;
                    if (remainingTaskMinutes >= 15) {
                        const continuation = new Task({
                            user: task.user,
                            skill: task.skill,
                            title: `${task.title} (cont.)`,
                            description: task.description,
                            type: 'learning',
                            scheduledDate: new Date(currentDate.getTime() + 86400000),
                            estimatedDuration: remainingTaskMinutes,
                            importance: task.importance,
                            isSplittable: true,
                            status: 'pending',
                            resources: task.resources,
                            dayNumber: task.dayNumber
                        });
                        await continuation.save();
                        tasks.splice(taskPointers[skillId] + 1, 0, continuation);
                    }

                    skillMinutesUsed += remainingMinutes;
                    taskPointers[skillId]++;
                    anyTaskScheduled = true;
                } else {
                    // Can't fit, try next task
                    break;
                }
            }
        }

        // Check if all done
        const allDone = skillIds.every(id => taskPointers[id] >= tasksBySkill[id].length);
        if (allDone) break;

        if (!anyTaskScheduled) {
            // Move to next day if nothing scheduled
            currentDate.setDate(currentDate.getDate() + 1);
            dayCount++;
        } else {
            currentDate.setDate(currentDate.getDate() + 1);
            dayCount++;
        }
    }

    // Update skill end dates
    for (const skill of activeSkills) {
        const lastTask = await Task.findOne({
            skill: skill._id,
            user: userId
        }).sort({ scheduledDate: -1 });

        if (lastTask) {
            skill.endDate = lastTask.scheduledDate;
            await skill.save();
        }
    }

    return {
        success: true,
        message: `Rescheduled ${totalRescheduled} tasks across ${activeSkills.length} skills`,
        rescheduledCount: totalRescheduled,
        hoursPerSkill: minutesPerSkill / 60,
        skills: activeSkills.map(s => ({ skillId: s._id, skillName: s.name }))
    };
};

module.exports = {
    detectMissedTasks,
    calculateAvailableHours,
    findNextAvailableSlot,
    replanMissedTasks,
    replanSkillTasks,
    generateWorkoutTasks,
    rescheduleOnTimeChange
};
