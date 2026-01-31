import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    ClockIcon,
    SunIcon,
    MoonIcon,
    HeartIcon,
    AcademicCapIcon,
    ArrowLeftIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [skillInput, setSkillInput] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        dailyLearningHours: 2,
        wakeTime: '07:00',
        sleepTime: '23:00',
        workoutEnabled: false,
        workoutPreference: 'none',
        existingSkills: []
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/profile');
            const { name, profile } = response.data.data;
            setFormData({
                name: name || '',
                dailyLearningHours: profile?.dailyLearningHours || 2,
                wakeTime: profile?.wakeTime || '07:00',
                sleepTime: profile?.sleepTime || '23:00',
                workoutEnabled: profile?.workoutEnabled || false,
                workoutPreference: profile?.workoutPreference || 'none',
                existingSkills: profile?.existingSkills || []
            });
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.existingSkills.includes(skillInput.trim())) {
            setFormData(prev => ({
                ...prev,
                existingSkills: [...prev.existingSkills, skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            existingSkills: prev.existingSkills.filter(s => s !== skill)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.put('/profile', formData);
            updateUser(response.data.data);

            // Build notification message
            const messages = [];

            const rescheduled = response.data.rescheduled;
            if (rescheduled && rescheduled.rescheduledCount > 0) {
                messages.push(`${rescheduled.rescheduledCount} tasks rescheduled`);
            }

            const deletedWorkouts = response.data.deletedWorkoutTasks;
            if (deletedWorkouts > 0) {
                messages.push(`${deletedWorkouts} workout tasks removed`);
            }

            if (messages.length > 0) {
                toast.success(`Profile updated! ${messages.join(', ')}.`);
            } else {
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
                        <p className="text-gray-400 mt-1">Update your preferences</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="card">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="input-field"
                            placeholder="Your name"
                        />
                    </div>

                    {/* Learning Schedule */}
                    <div className="card">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-primary-500/20 rounded-xl">
                                <ClockIcon className="h-6 w-6 text-primary-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Learning Schedule</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-4">
                                Daily Learning Hours: <span className="text-primary-400 font-bold">{formData.dailyLearningHours}h</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="8"
                                value={formData.dailyLearningHours}
                                onChange={(e) => handleChange('dailyLearningHours', parseInt(e.target.value))}
                                className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-2">
                                <span>1h</span>
                                <span>8h</span>
                            </div>
                        </div>
                    </div>

                    {/* Sleep Schedule */}
                    <div className="card">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-secondary-500/20 rounded-xl">
                                <SunIcon className="h-6 w-6 text-secondary-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Sleep Schedule</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    <SunIcon className="inline h-4 w-4 mr-1" />
                                    Wake Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.wakeTime}
                                    onChange={(e) => handleChange('wakeTime', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    <MoonIcon className="inline h-4 w-4 mr-1" />
                                    Sleep Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.sleepTime}
                                    onChange={(e) => handleChange('sleepTime', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Workout Preference */}
                    <div className="card">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-red-500/20 rounded-xl">
                                <HeartIcon className="h-6 w-6 text-red-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Workout Preference</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-dark-300/50 rounded-xl">
                                <span className="text-white">Enable Daily Workout</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newEnabled = !formData.workoutEnabled;
                                        handleChange('workoutEnabled', newEnabled);
                                        if (!newEnabled) handleChange('workoutPreference', 'none');
                                    }}
                                    className={`w-14 h-7 rounded-full transition-all duration-300 ${formData.workoutEnabled ? 'bg-primary-500' : 'bg-dark-100'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 ${formData.workoutEnabled ? 'translate-x-8' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            {formData.workoutEnabled && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleChange('workoutPreference', 'morning')}
                                        className={`p-4 rounded-xl border transition-all duration-200 ${formData.workoutPreference === 'morning'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <SunIcon className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
                                        <span className="text-white">Morning</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('workoutPreference', 'evening')}
                                        className={`p-4 rounded-xl border transition-all duration-200 ${formData.workoutPreference === 'evening'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <MoonIcon className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                                        <span className="text-white">Evening</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Existing Skills */}
                    <div className="card">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-green-500/20 rounded-xl">
                                <AcademicCapIcon className="h-6 w-6 text-green-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Your Existing Skills</h2>
                        </div>

                        <div>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    className="input-field flex-1"
                                    placeholder="e.g., JavaScript, Python..."
                                />
                                <button
                                    type="button"
                                    onClick={addSkill}
                                    className="btn-primary px-4"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {formData.existingSkills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="ml-2 hover:text-red-400"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <CheckIcon className="h-5 w-5" />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default Profile;
