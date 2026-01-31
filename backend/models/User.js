const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    isOnboarded: {
        type: Boolean,
        default: false
    },
    profile: {
        dailyLearningHours: {
            type: Number,
            default: 2,
            min: 1,
            max: 12
        },
        freeTimeSlots: [{
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            startTime: String,
            endTime: String
        }],
        sleepTime: {
            type: String,
            default: '23:00'
        },
        wakeTime: {
            type: String,
            default: '07:00'
        },
        workoutEnabled: {
            type: Boolean,
            default: false
        },
        workoutPreference: {
            type: String,
            enum: ['morning', 'evening', 'none'],
            default: 'none'
        },
        existingSkills: [{
            type: String,
            trim: true
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
