import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import {
    LayoutDashboard,
    Award,
    User,
    Bell,
    LogOut,
    GraduationCap,
    X,
    ListTodo,
    MessageCircle,
    Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/logo1_backup.png';

export function InternSidebar({ isOpen, onClose }) {
    const { logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const fetchUnreadCount = async () => {
            try {
                const res = await axios.get('/api/notifications');
                if (res.data.success && isMounted) {
                    const unread = res.data.data.filter(n => !n.isRead).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                console.error('Error fetching unread notifications count:', error);
            }
        };

        fetchUnreadCount();
        const intervalId = setInterval(fetchUnreadCount, 60000); // refresh every minute

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/intern' },
        { icon: ListTodo, label: 'My Tasks', path: '/intern/tasks' },
        { icon: Award, label: 'My Certificates', path: '/intern/certificates' },
        { icon: Trophy, label: 'Leaderboard', path: '/intern/leaderboard' },
        { icon: MessageCircle, label: 'Chat', path: '/intern/chat' },
        { icon: User, label: 'Profile', path: '/intern/profile' },
        { icon: Bell, label: 'Notifications', path: '/intern/notifications' },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-800/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
                transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block shadow-xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <img src={logoImage} alt="InternSys Logo" className="h-8 md:h-10 w-auto object-contain" />
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Menu
                        </div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/intern'}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                                className={({ isActive }) => `
                                    group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-200'
                                        : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-sky-600' : 'text-gray-400 group-hover:text-sky-500'}`} />
                                        <span className="flex-1">{item.label}</span>
                                        {item.label === 'Notifications' && unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={logout}
                            className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
