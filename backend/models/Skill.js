const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Skill name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    targetDays: {
        type: Number,
        required: [true, 'Target days is required'],
        min: 1,
        max: 365
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'paused'],
        default: 'not_started'
    },
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    dailyTopics: [{
        day: Number,
        topic: String,
        description: String,
        estimatedHours: Number,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
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

// Calculate end date before saving
SkillSchema.pre('save', function (next) {
    if (this.isModified('targetDays') || this.isModified('startDate')) {
        const endDate = new Date(this.startDate);
        endDate.setDate(endDate.getDate() + this.targetDays);
        this.endDate = endDate;
    }
    this.updatedAt = Date.now();
    next();
});

// Calculate progress based on completed topics
SkillSchema.methods.calculateProgress = function () {
    if (this.dailyTopics.length === 0) return 0;
    const completed = this.dailyTopics.filter(t => t.completed).length;
    return Math.round((completed / this.dailyTopics.length) * 100);
};

module.exports = mongoose.model('Skill', SkillSchema);
