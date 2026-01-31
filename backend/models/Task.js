const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
    },
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['learning', 'workout', 'custom'],
        default: 'learning'
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    scheduledTime: {
        startTime: String,
        endTime: String
    },
    estimatedDuration: {
        type: Number,
        default: 60,
        min: 15
    },
    importance: {
        type: Number,
        default: 3,
        min: 1,
        max: 5
    },
    isSplittable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'missed', 'rescheduled'],
        default: 'pending'
    },
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    resources: [{
        title: String,
        url: String,
        type: {
            type: String,
            enum: ['youtube', 'article', 'documentation', 'other'],
            default: 'youtube'
        },
        thumbnail: String
    }],
    notes: {
        type: String,
        trim: true
    },
    completedAt: {
        type: Date
    },
    originalDate: {
        type: Date
    },
    rescheduledCount: {
        type: Number,
        default: 0
    },
    dayNumber: {
        type: Number
    },
    topicIndex: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
TaskSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Mark as completed
TaskSchema.methods.markComplete = function () {
    this.status = 'completed';
    this.completedAt = Date.now();
    return this.save();
};

// Mark as missed
TaskSchema.methods.markMissed = function () {
    this.status = 'missed';
    if (!this.originalDate) {
        this.originalDate = this.scheduledDate;
    }
    return this.save();
};

// Reschedule task
TaskSchema.methods.reschedule = function (newDate) {
    if (!this.originalDate) {
        this.originalDate = this.scheduledDate;
    }
    this.scheduledDate = newDate;
    this.status = 'rescheduled';
    this.rescheduledCount += 1;
    return this.save();
};

// Static method to get tasks for a specific date
TaskSchema.statics.getTasksForDate = function (userId, date) {
    // Parse the date string and create UTC range for the full day
    const d = new Date(date);
    const startOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));

    return this.find({
        user: userId,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('skill', 'name').sort({ 'scheduledTime.startTime': 1 });
};

// Static method to get missed tasks
TaskSchema.statics.getMissedTasks = function (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.find({
        user: userId,
        scheduledDate: { $lt: today },
        status: { $in: ['pending', 'missed'] }
    }).populate('skill', 'name');
};

module.exports = mongoose.model('Task', TaskSchema);
