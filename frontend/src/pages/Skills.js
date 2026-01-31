import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    PlusIcon,
    AcademicCapIcon,
    TrashIcon,
    SparklesIcon,
    XMarkIcon,
    ClockIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

const Skills = () => {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [generating, setGenerating] = useState(null);
    const [newSkill, setNewSkill] = useState({
        name: '',
        description: '',
        targetDays: 30,
        priority: 1
    });

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const response = await api.get('/skills');
            setSkills(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch skills');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSkill = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/skills', newSkill);
            setSkills([response.data.data, ...skills]);
            setShowModal(false);
            setNewSkill({ name: '', description: '', targetDays: 30, priority: 1 });
            toast.success('Skill created successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create skill');
        }
    };

    const handleGeneratePlan = async (skillId) => {
        setGenerating(skillId);
        try {
            const response = await api.post(`/ai/generate-plan/${skillId}`);
            const data = response.data.data;

            // Build notification message
            let message = `Created ${data.tasksCreated} learning tasks!`;

            // If other skills were rescheduled
            if (data.otherSkillsRescheduled && data.otherSkillsRescheduled.rescheduledCount > 0) {
                message += ` ${data.otherSkillsRescheduled.rescheduledCount} tasks from other skills redistributed to share your ${data.hoursPerSkill.toFixed(1)}h/day.`;
            }

            toast.success(message);
            fetchSkills();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate plan');
        } finally {
            setGenerating(null);
        }
    };

    const handleDeleteSkill = async (skillId) => {
        if (!window.confirm('Delete this skill and all its tasks?')) return;

        try {
            const response = await api.delete(`/skills/${skillId}`);
            setSkills(skills.filter(s => s._id !== skillId));

            // Show notification about redistribution
            const rescheduled = response.data.rescheduled;
            if (rescheduled && rescheduled.rescheduledCount > 0) {
                toast.success(`Skill deleted! ${rescheduled.rescheduledCount} tasks redistributed to use the freed-up time.`);
            } else {
                toast.success('Skill deleted');
            }
        } catch (error) {
            toast.error('Failed to delete skill');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-400';
            case 'in_progress': return 'bg-primary-500/20 text-primary-400';
            case 'paused': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Skills to Learn</h1>
                        <p className="text-gray-400 mt-1">Manage your learning goals</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Skill</span>
                    </button>
                </div>

                {/* Skills Grid */}
                {skills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map((skill) => (
                            <div key={skill._id} className="card group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-primary-500/20 rounded-xl">
                                            <AcademicCapIcon className="h-6 w-6 text-primary-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{skill.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(skill.status)}`}>
                                                {skill.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSkill(skill._id)}
                                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {skill.description && (
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{skill.description}</p>
                                )}

                                <div className="space-y-3">
                                    {/* Progress */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Progress</span>
                                            <span className="text-primary-400">{skill.progress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${skill.progress}%` }} />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>{skill.targetDays} days</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <ClockIcon className="h-4 w-4" />
                                            <span>{skill.dailyTopics?.length || 0} topics</span>
                                        </div>
                                    </div>

                                    {/* Generate Button */}
                                    {skill.status === 'not_started' && (
                                        <button
                                            onClick={() => handleGeneratePlan(skill._id)}
                                            disabled={generating === skill._id}
                                            className="w-full btn-secondary flex items-center justify-center space-x-2 mt-4"
                                        >
                                            {generating === skill._id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500"></div>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <SparklesIcon className="h-4 w-4" />
                                                    <span>Generate AI Plan</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <AcademicCapIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No skills yet</h3>
                        <p className="text-gray-400 mb-6">Add your first skill to start your learning journey</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary inline-flex items-center"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Your First Skill
                        </button>
                    </div>
                )}
            </main>

            {/* Add Skill Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card max-w-md w-full animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add New Skill</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-gray-400 hover:text-white"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSkill} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Skill Name *
                                </label>
                                <input
                                    type="text"
                                    value={newSkill.name}
                                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Machine Learning, React.js..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newSkill.description}
                                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                                    className="input-field min-h-[80px]"
                                    placeholder="What do you want to achieve?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Target Days: <span className="text-primary-400">{newSkill.targetDays} days</span>
                                </label>
                                <input
                                    type="range"
                                    min="7"
                                    max="90"
                                    value={newSkill.targetDays}
                                    onChange={(e) => setNewSkill({ ...newSkill, targetDays: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-sm text-gray-500 mt-1">
                                    <span>1 week</span>
                                    <span>3 months</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Priority
                                </label>
                                <div className="flex space-x-2">
                                    {[1, 2, 3, 4, 5].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setNewSkill({ ...newSkill, priority: p })}
                                            className={`w-10 h-10 rounded-lg transition-all duration-200 ${newSkill.priority === p
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn-primary">
                                    Create Skill
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Skills;
