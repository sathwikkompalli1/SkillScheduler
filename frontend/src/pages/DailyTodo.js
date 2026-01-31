import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    CheckCircleIcon,
    ClockIcon,
    PlayIcon,
    ArrowPathIcon,
    CalendarDaysIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

const DailyTodo = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [replanning, setReplanning] = useState(false);
    const [missedCount, setMissedCount] = useState(0);

    useEffect(() => {
        fetchTasks();
        fetchMissedCount();
    }, [selectedDate]);

    const fetchTasks = async () => {
        try {
            // Use local date parts to avoid timezone issues
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const response = await api.get(`/tasks/date/${dateStr}`);
            setTasks(response.data.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMissedCount = async () => {
        try {
            const response = await api.get('/tasks/missed');
            setMissedCount(response.data.count);
        } catch (error) {
            console.error('Error fetching missed count:', error);
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await api.put(`/tasks/${taskId}/complete`);
            setTasks(tasks.map(t =>
                t._id === taskId ? { ...t, status: 'completed' } : t
            ));
            toast.success('Task completed! 🎉');
        } catch (error) {
            toast.error('Failed to complete task');
        }
    };

    const handleReplan = async () => {
        setReplanning(true);
        try {
            const response = await api.post('/ai/replan');
            toast.success(response.data.data.message);
            fetchTasks();
            fetchMissedCount();
        } catch (error) {
            toast.error('Failed to replan tasks');
        } finally {
            setReplanning(false);
        }
    };

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
        setLoading(true);
    };

    const isToday = () => {
        const today = new Date();
        return selectedDate.toDateString() === today.toDateString();
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTaskTypeIcon = (type) => {
        switch (type) {
            case 'workout': return '💪';
            case 'learning': return '📚';
            default: return '✨';
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/10 border-green-500/30';
            case 'in_progress':
                return 'bg-primary-500/10 border-primary-500/30';
            case 'missed':
                return 'bg-red-500/10 border-red-500/30';
            case 'rescheduled':
                return 'bg-yellow-500/10 border-yellow-500/30';
            default:
                return 'bg-dark-300/50 border-white/10';
        }
    };

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Date Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => changeDate(-1)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>

                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white flex items-center justify-center">
                            <CalendarDaysIcon className="h-7 w-7 mr-2 text-primary-400" />
                            {isToday() ? "Today's Tasks" : formatDate(selectedDate)}
                        </h1>
                        {!isToday() && (
                            <button
                                onClick={() => setSelectedDate(new Date())}
                                className="text-primary-400 hover:text-primary-300 text-sm mt-1"
                            >
                                Go to Today
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronRightIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                {totalTasks > 0 && (
                    <div className="card mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-400">Daily Progress</span>
                            <span className="text-primary-400 font-medium">
                                {completedTasks}/{totalTasks} tasks
                            </span>
                        </div>
                        <div className="progress-bar h-3">
                            <div
                                className="progress-fill"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        {progressPercentage === 100 && (
                            <p className="text-center text-green-400 mt-3 font-medium">
                                🎉 All tasks completed! Great job!
                            </p>
                        )}
                    </div>
                )}

                {/* Missed Tasks Warning */}
                {missedCount > 0 && isToday() && (
                    <div className="card mb-6 border-yellow-500/30 bg-yellow-500/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                                <div>
                                    <p className="text-white font-medium">You have {missedCount} missed tasks</p>
                                    <p className="text-sm text-gray-400">Let AI reschedule them for you</p>
                                </div>
                            </div>
                            <button
                                onClick={handleReplan}
                                disabled={replanning}
                                className="btn-primary flex items-center space-x-2"
                            >
                                {replanning ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                        <span>Replanning...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-4 w-4" />
                                        <span>Auto Replan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tasks List */}
                {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.map((task, index) => (
                            <div
                                key={task._id}
                                className={`card border ${getStatusStyles(task.status)} animate-fade-in`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <button
                                            onClick={() => task.status !== 'completed' && handleCompleteTask(task._id)}
                                            disabled={task.status === 'completed'}
                                            className={`mt-1 transition-all duration-200 ${task.status === 'completed'
                                                ? 'text-green-400'
                                                : 'text-gray-500 hover:text-primary-400'
                                                }`}
                                        >
                                            {task.status === 'completed' ? (
                                                <CheckCircleSolidIcon className="h-6 w-6" />
                                            ) : (
                                                <CheckCircleIcon className="h-6 w-6" />
                                            )}
                                        </button>

                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span>{getTaskTypeIcon(task.type)}</span>
                                                <h3 className={`font-medium ${task.status === 'completed'
                                                    ? 'text-gray-500 line-through'
                                                    : 'text-white'
                                                    }`}>
                                                    {task.title}
                                                </h3>
                                            </div>

                                            {task.description && (
                                                <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                                            )}

                                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <ClockIcon className="h-4 w-4 mr-1" />
                                                    {task.estimatedDuration} min
                                                </span>
                                                {task.skill && (
                                                    <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                                                        {task.skill.name}
                                                    </span>
                                                )}
                                                {task.rescheduledCount > 0 && (
                                                    <span className="flex items-center text-yellow-400">
                                                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                                                        Rescheduled {task.rescheduledCount}x
                                                    </span>
                                                )}
                                            </div>

                                            {/* Resources */}
                                            {task.resources && task.resources.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs text-gray-500 mb-2">Resources:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {task.resources.slice(0, 3).map((resource, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={resource.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg 
                                         hover:bg-red-500/30 transition-colors flex items-center"
                                                            >
                                                                <PlayIcon className="h-3 w-3 mr-1" />
                                                                YouTube
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {task.scheduledTime?.startTime && (
                                        <div className="text-right text-sm">
                                            <span className="text-gray-400">
                                                {task.scheduledTime.startTime}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <CalendarDaysIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">
                            No tasks for {isToday() ? 'today' : 'this day'}
                        </h3>
                        <p className="text-gray-400">
                            {isToday()
                                ? 'Add a skill and generate a learning plan to get started'
                                : 'Navigate to today to see your current tasks'
                            }
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DailyTodo;
