import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HomeIcon,
    AcademicCapIcon,
    CalendarDaysIcon,
    ArrowRightOnRectangleIcon,
    SparklesIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
        { path: '/skills', label: 'Skills', icon: AcademicCapIcon },
        { path: '/today', label: 'Today', icon: CalendarDaysIcon },
        { path: '/profile', label: 'Profile', icon: UserCircleIcon },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/dashboard" className="flex items-center space-x-2">
                        <SparklesIcon className="h-8 w-8 text-primary-500" />
                        <span className="text-xl font-bold gradient-text">SkillPlanner</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${isActive(item.path)
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-400">
                            <span className="text-white font-medium">{user?.name}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-red-400 
                         transition-colors duration-200 rounded-lg hover:bg-red-500/10"
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden border-t border-white/10">
                <div className="flex justify-around py-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all duration-200
                ${isActive(item.path)
                                    ? 'text-primary-400'
                                    : 'text-gray-400'
                                }`}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
