import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, UserCheck, FileText, Download, TrendingUp, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

const stats = [
    { title: 'Total Interns', value: '1,234', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Interns', value: '856', change: '+5%', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Certificates', value: '3,421', change: '+8%', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Downloads', value: '8,920', change: '+24%', icon: Download, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const activities = [
    { title: 'New registration', time: '2 mins ago', user: 'Amit Kumar' },
    { title: 'Certificate downloaded', time: '15 mins ago', user: 'Sarah Wilson' },
    { title: 'Intern promoted', time: '1 hour ago', user: 'Rajesh Singh' },
    { title: 'New batch added', time: '3 hours ago', user: 'System Admin' },
    { title: 'Profile updated', time: '5 hours ago', user: 'Priya Patel' },
];

export default function Dashboard() {
    const { addToast } = useToast();

    const handleDownload = () => {
        addToast('Downloading monthly report...', 'info');
        // Mock download
        setTimeout(() => addToast('Report downloaded successfully!', 'success'), 1500);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-500 text-sm mt-1">Overview of your internship program.</p>
                </div>
                <Button onClick={handleDownload}>
                    <Download size={16} className="mr-2" />
                    Download Report
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                                    <stat.icon size={24} className={stat.color} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-green-600 font-medium flex items-center">
                                    <TrendingUp size={14} className="mr-1" />
                                    {stat.change}
                                </span>
                                <span className="text-gray-400 ml-2">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart/Table placeholder */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Interns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Role</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">Intern User {i}</td>
                                            <td className="px-4 py-3 text-gray-500">Frontend Dev</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">Jan 29, 2026</td>
                                            <td className="px-4 py-3">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {activities.map((activity, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-brand-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">by <span className="font-semibold">{activity.user}</span> • {activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
