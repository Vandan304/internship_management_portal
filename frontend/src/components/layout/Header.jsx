import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export function Header({ onMenuClick }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                // Only interns have this route in our specific requested app setup
                if (user?.role !== 'intern') return;

                const res = await axios.get('/api/notifications');
                if (res.data.success) {
                    const unread = res.data.data.some(n => !n.isRead);
                    setHasUnread(unread);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchUnread();
        const intervalId = setInterval(fetchUnread, 60000);
        return () => clearInterval(intervalId);
    }, [user]);

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                    <Menu size={20} />
                </button>

                <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
                    Overview
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Search Bar (Optional) */}
                <div className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400"
                    />
                </div>

                {user && user.role === "intern" && (
                    <button
                        onClick={() => navigate("/intern/notifications")}
                        className="p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600 rounded-full transition-colors relative"
                    >
                        <Bell size={20} />
                        {hasUnread && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                )}

                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3 pl-1">
                    <div className="flex flex-col items-end hidden sm:block">
                        <span className="text-sm font-medium text-gray-900 capitalize">{user?.name || 'User'}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{user?.role || 'Guest'}</span>
                    </div>
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold border border-brand-200 uppercase">
                        {user?.name ? user.name.charAt(0) : <User size={18} />}
                    </div>
                </div>
            </div>
        </header>
    );
}
