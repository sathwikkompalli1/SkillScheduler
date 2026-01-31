import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    AcademicCapIcon,
    CalendarDaysIcon,
    ClockIcon,
    ChartBarIcon,
    SparklesIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalSkills: 0,
        activeSkills: 0,
        completedSkills: 0,
        todayTasks: 0,
        completedToday: 0,
        missedTasks: 0
    });
    const [recentTasks, setRecentTasks] = useState([]);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [skillsRes, todayRes, missedRes] = await Promise.all([
                api.get('/skills'),
                api.get('/tasks/today'),
                api.get('/tasks/missed')
            ]);

            const skillsData = skillsRes.data.data;
            const todayTasks = todayRes.data.data;
            const missedTasks = missedRes.data.data;

            setSkills(skillsData.slice(0, 3));
            setRecentTasks(todayTasks.slice(0, 5));

            setStats({
                totalSkills: skillsData.length,
                activeSkills: skillsData.filter(s => s.status === 'in_progress').length,
                completedSkills: skillsData.filter(s => s.status === 'completed').length,
                todayTasks: todayTasks.length,
                completedToday: todayTasks.filter(t => t.status === 'completed').length,
                missedTasks: missedTasks.length
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
        <div className="card group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{value}</p>
                    {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
                </div>
                <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );

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
                {/* Welcome Section */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-white">
                        Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋
                    </h1>
                    <p className="text-gray-400 mt-2">Here's your learning progress overview</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={AcademicCapIcon}
                        label="Active Skills"
                        value={stats.activeSkills}
                        subValue={`${stats.totalSkills} total`}
                        color="bg-primary-500/20 text-primary-400"
                    />
                    <StatCard
                        icon={CalendarDaysIcon}
                        label="Today's Tasks"
                        value={stats.todayTasks}
                        subValue={`${stats.completedToday} completed`}
                        color="bg-green-500/20 text-green-400"
                    />
                    <StatCard
                        icon={CheckCircleIcon}
                        label="Completed Skills"
                        value={stats.completedSkills}
                        color="bg-secondary-500/20 text-secondary-400"
                    />
                    <StatCard
                        icon={ExclamationCircleIcon}
                        label="Missed Tasks"
                        value={stats.missedTasks}
                        subValue={stats.missedTasks > 0 ? "Needs replanning" : "All caught up!"}
                        color={stats.missedTasks > 0 ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Today's Tasks */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <ClockIcon className="h-5 w-5 mr-2 text-primary-400" />
                                Today's Tasks
                            </h2>
                            <Link to="/today" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                                View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                            </Link>
                        </div>

                        {recentTasks.length > 0 ? (
                            <div className="space-y-3">
                                {recentTasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${task.status === 'completed'
                                                ? 'bg-green-500/10 border border-green-500/20'
                                                : 'bg-dark-300/50 hover:bg-dark-300'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                                    task.type === 'workout' ? 'bg-red-500' : 'bg-primary-500'
                                                }`} />
                                            <div>
                                                <p className={`font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-gray-500">{task.skill?.name || task.type}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {task.estimatedDuration}m
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CalendarDaysIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No tasks scheduled for today</p>
                                <Link to="/skills" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                                    Add a skill to get started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Active Skills */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <SparklesIcon className="h-5 w-5 mr-2 text-secondary-400" />
                                Learning Progress
                            </h2>
                            <Link to="/skills" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                                View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                            </Link>
                        </div>

                        {skills.length > 0 ? (
                            <div className="space-y-4">
                                {skills.map((skill) => (
                                    <div key={skill._id} className="p-4 bg-dark-300/50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-white">{skill.name}</h3>
                                            <span className="text-sm text-primary-400">{skill.progress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${skill.progress}%` }} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {skill.targetDays} days • {skill.dailyTopics?.filter(t => t.completed).length || 0}/{skill.dailyTopics?.length || 0} topics
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <AcademicCapIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No skills added yet</p>
                                <Link to="/skills" className="btn-primary inline-flex items-center mt-4">
                                    <SparklesIcon className="h-5 w-5 mr-2" />
                                    Add Your First Skill
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/skills"
                        className="card flex items-center space-x-4 hover:border-primary-500/50 transition-all duration-300"
                    >
                        <div className="p-3 bg-primary-500/20 rounded-xl">
                            <AcademicCapIcon className="h-6 w-6 text-primary-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Add New Skill</h3>
                            <p className="text-sm text-gray-500">Start learning something new</p>
                        </div>
                    </Link>

                    <Link
                        to="/today"
                        className="card flex items-center space-x-4 hover:border-secondary-500/50 transition-all duration-300"
                    >
                        <div className="p-3 bg-secondary-500/20 rounded-xl">
                            <CalendarDaysIcon className="h-6 w-6 text-secondary-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white">View Today's Plan</h3>
                            <p className="text-sm text-gray-500">Check your daily tasks</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => window.location.reload()}
                        className="card flex items-center space-x-4 hover:border-green-500/50 transition-all duration-300 text-left"
                    >
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <ChartBarIcon className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Refresh Stats</h3>
                            <p className="text-sm text-gray-500">Update your progress</p>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
