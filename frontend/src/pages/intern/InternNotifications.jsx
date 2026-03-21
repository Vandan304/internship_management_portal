import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Bell, Check, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const InternNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    const { socket } = useAuth();

    const formatTime = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return new Date(date).toLocaleString();
        }
    };

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get('/api/notifications');
            if (res.data.success) {
                setNotifications(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            addToast('Failed to load notifications', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // 1. Back-up Polling (Every 5 seconds)
        const interval = setInterval(() => {
            fetchNotifications();
        }, 5000);

        // 2. Real-time Socket Updates
        if (socket) {
            socket.on('newNotification', (newNotification) => {
                setNotifications(prev => {
                    // Prevent duplicates if polling/socket arrive at same time
                    if (prev.some(n => n._id === newNotification._id)) return prev;
                    return [newNotification, ...prev];
                });
            });
        }

        return () => {
            clearInterval(interval);
            if (socket) socket.off('newNotification');
        };
    }, [socket]); // Socket dependency attached so it re-binds if socket initializes late

    const handleMarkAsRead = async (id) => {
        try {
            const res = await axios.patch(`/api/notifications/${id}/read`);
            if (res.data.success) {
                setNotifications(prev => {
                    const next = prev.map(n => n._id === id ? { ...n, isRead: true } : n);
                    const unreadCount = next.filter(n => !n.isRead).length;
                    window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { unreadCount } }));
                    return next;
                });
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const res = await axios.patch('/api/notifications/mark-all-read');
            if (res.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                addToast('All notifications marked as read', 'success');
                window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { unreadCount: 0 } }));
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            addToast('Failed to mark all as read', 'error');
        }
    };

    const unreadCount = (notifications || []).filter(n => !n.isRead).length;

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 text-sm mt-1">Stay updated on your certificates and profile changes.</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardContent className="p-0 overflow-y-auto flex-1 scrollbar-hide">
                        {isLoading ? (
                        <div className="p-12 flex justify-center"><LoadingSpinner message="Loading notifications..." /></div>
                    ) : (!notifications || notifications.length === 0) ? (
                        <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-900">No notifications yet</p>
                            <p className="text-sm">We'll notify you when there's an update.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {(notifications || []).map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-4 sm:p-6 transition-colors duration-200 cursor-pointer ${notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-brand-50/30 hover:bg-brand-50/50'}`}
                                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                                >
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            {!notification.isRead && (
                                                <div className="w-2.5 h-2.5 bg-brand-600 rounded-full mt-1.5 shadow-sm shadow-brand-500/50" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-1">
                                                <h4 className={`text-sm sm:text-base font-semibold ${notification.isRead ? 'text-gray-900' : 'text-brand-900'}`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default InternNotifications;
