import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    ClockIcon,
    SunIcon,
    MoonIcon,
    SparklesIcon,
    AcademicCapIcon,
    HeartIcon,
    ChevronRightIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        dailyLearningHours: 2,
        wakeTime: '07:00',
        sleepTime: '23:00',
        workoutEnabled: false,
        workoutPreference: 'none',
        existingSkills: [],
        freeTimeSlots: []
    });

    const [skillInput, setSkillInput] = useState('');

    const totalSteps = 4;

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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await api.put('/profile/onboard', formData);
            updateUser(response.data.data);
            toast.success('Profile setup complete!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-2xl mb-4">
                                <ClockIcon className="h-8 w-8 text-primary-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Learning Schedule</h2>
                            <p className="text-gray-400 mt-2">How much time can you dedicate daily?</p>
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
                );

            case 2:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-500/20 rounded-2xl mb-4">
                                <SunIcon className="h-8 w-8 text-secondary-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Sleep Schedule</h2>
                            <p className="text-gray-400 mt-2">When do you wake up and sleep?</p>
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
                );

            case 3:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl mb-4">
                                <HeartIcon className="h-8 w-8 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Workout Preference</h2>
                            <p className="text-gray-400 mt-2">Include workout in your daily routine?</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-dark-300/50 rounded-xl">
                                <span className="text-white">Enable Daily Workout</span>
                                <button
                                    onClick={() => handleChange('workoutEnabled', !formData.workoutEnabled)}
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
                );

            case 4:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-2xl mb-4">
                                <AcademicCapIcon className="h-8 w-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Your Skills</h2>
                            <p className="text-gray-400 mt-2">What skills do you already have?</p>
                        </div>

                        <div>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                    className="input-field flex-1"
                                    placeholder="e.g., JavaScript, Python..."
                                />
                                <button
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
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${s <= step
                                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                                        : 'bg-dark-300 text-gray-500'
                                    }`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-dark-300 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Form Card */}
                <div className="card">
                    {renderStep()}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(step - 1)}
                            disabled={step === 1}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${step === 1
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                            <span>Back</span>
                        </button>

                        {step < totalSteps ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <span>Next</span>
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary flex items-center space-x-2"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-5 w-5" />
                                        <span>Complete Setup</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
