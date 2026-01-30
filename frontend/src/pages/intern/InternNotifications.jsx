import React from 'react';
import { Bell, Award, UserCheck, Info, Check } from 'lucide-react';

const InternNotifications = () => {
    const notifications = [
        {
            id: 1,
            type: 'success',
            icon: Award,
            title: 'New Certificate Assigned',
            message: 'You have been assigned the "Full Stack Web Development" certificate.',
            time: '2 hours ago',
            read: false
        },
        {
            id: 2,
            type: 'info',
            icon: UserCheck,
            title: 'Profile Update Successful',
            message: 'Your profile information has been successfully updated.',
            time: '1 day ago',
            read: true
        },
        {
            id: 3,
            type: 'warning',
            icon: Info,
            title: 'System Maintenance',
            message: 'The portal will be undergoing scheduled maintenance on Saturday at 10 PM.',
            time: '2 days ago',
            read: true
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500">Stay updated with your latest alerts</p>
                </div>
                <button className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Mark all as read
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`p-6 flex gap-4 transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-brand-50/30' : ''}`}
                    >
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                            ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-blue-100 text-blue-600'}
                        `}>
                            <notification.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className={`font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                                    {notification.title}
                                </h3>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{notification.time}</span>
                            </div>
                            <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                                {notification.message}
                            </p>
                        </div>
                        {!notification.read && (
                            <div className="flex-shrink-0">
                                <div className="w-2.5 h-2.5 bg-brand-500 rounded-full"></div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Empty State */}
                {notifications.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                        <p className="text-gray-500 mt-2">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InternNotifications;
