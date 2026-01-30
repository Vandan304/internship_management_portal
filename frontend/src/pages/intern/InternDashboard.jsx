import React from 'react';
import { Award, Download, UserCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const InternDashboard = () => {
    const { user } = useAuth();
    const { certificates } = useData();

    // Calculate Stats
    const myCertificates = certificates.filter(cert =>
        cert.assignments && cert.assignments.some(a => a.internId === user.id)
    );
    const downloadCount = myCertificates.filter(c =>
        c.assignments.find(a => a.internId === user.id).canDownload
    ).length;

    const stats = [
        { title: 'My Certificates', value: myCertificates.length, icon: Award, color: 'text-brand-600', bg: 'bg-brand-50' },
        { title: 'Available Downloads', value: downloadCount, icon: Download, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Account Status', value: user?.status || 'Active', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    const recentActivity = [
        { title: 'Logged in successfully', time: 'Just now', icon: Clock },
        // Could be dynamic if we tracked activity
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-gray-600 mt-1">Here's an overview of your progress.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Certificates */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Certificates</h3>
                    <div className="space-y-4">
                        {myCertificates.slice(0, 3).map((cert) => (
                            <div key={cert.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">{cert.name}</h4>
                                    <p className="text-xs text-gray-500">{cert.uploadedDate}</p>
                                </div>
                                {cert.assignments.find(a => a.internId === user.id).canDownload && (
                                    <button className="p-2 text-gray-400 hover:text-brand-600">
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {myCertificates.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No certificates yet.</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-6">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                    <activity.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                                <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Profile Created</p>
                                <p className="text-xs text-gray-500 mt-0.5">{user?.joinDate || 'Jan 2026'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternDashboard;
