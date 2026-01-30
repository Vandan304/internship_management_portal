import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Award,
    User,
    Bell,
    LogOut,
    GraduationCap,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function InternSidebar({ isOpen, onClose }) {
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/intern' },
        { icon: Award, label: 'My Certificates', path: '/intern/certificates' },
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
                            <div className="p-1.5 bg-brand-600 rounded-lg">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
                                InternSpace
                            </span>
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
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group'
                                    }
                                `}
                            >
                                <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-gray-100 space-y-2">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5 opacity-70" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
