import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import medal1 from '../../assets/medals/medal_1.png';
import medal2 from '../../assets/medals/medal_2.png';
import medal3 from '../../assets/medals/medal_3.png';

const medalMap = {
    1: medal1,
    2: medal2,
    3: medal3
};

const InternProgress = () => {
    const [stats, setStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { leaderboardData } = useData();

    useEffect(() => {
        const fetchProgressInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                // We fetch all interns and all tasks
                const [internsRes, tasksRes] = await Promise.all([
                    axios.get('/api/admin/interns', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (internsRes.data.success && tasksRes.data.success) {
                    const internsList = internsRes.data.data;
                    const tasksList = tasksRes.data.data;

                    const progressStats = internsList.map(intern => {
                        const internTasks = tasksList.filter(t => t.assignedTo?._id === intern._id || t.assignedTo === intern._id);
                        const totalTasks = internTasks.length;
                        const completedTasks = internTasks.filter(t => t.status === 'approved').length;
                        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                        return {
                            ...intern,
                            totalTasks,
                            completedTasks,
                            pendingTasks: totalTasks - completedTasks,
                            percentage
                        };
                    });

                    setStats(progressStats);
                }
            } catch (error) {
                console.error('Error fetching progress info:', error);
                toast.error('Failed to load progress details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProgressInfo();
    }, []);

    return (
        <div className="space-y-6 overflow-y-auto scrollbar-hide h-full pb-8 pr-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Intern Progress Manager</h1>
                    <p className="text-gray-500">Track and monitor task completion for all interns.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-12 flex justify-center"><LoadingSpinner message="Loading progress..." /></div>
                ) : stats.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-sm text-gray-500">No interns found.</div>
                ) : (
                    stats.map(intern => (
                        <div key={intern._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl">
                                    {intern.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900">{intern.name}{intern.internId ? ` (${intern.internId})` : ''}</h3>
                                        {(() => {
                                            const rankInfo = leaderboardData?.fullList?.find(l => l.id === (intern._id || intern.id) || l.internId === intern.internId);
                                            if (rankInfo && rankInfo.rank <= 3) {
                                                return (
                                                    <img 
                                                        src={medalMap[rankInfo.rank]} 
                                                        alt={`Rank ${rankInfo.rank}`} 
                                                        className="w-5 h-5 object-contain"
                                                        title={`Rank #${rankInfo.rank}`}
                                                    />
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <p className="text-xs text-gray-500">{intern.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Completed Tasks</span>
                                    <span className="font-medium text-gray-900">{intern.completedTasks} / {intern.totalTasks}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${intern.percentage === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                                        style={{ width: `${intern.percentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <p className="text-xs font-semibold text-yellow-600 uppercase">Pending</p>
                                    <p className="text-xl font-bold text-yellow-700">{intern.pendingTasks}</p>
                                </div>
                                <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
                                    <p className="text-xs font-semibold text-green-600 uppercase">Progress</p>
                                    <p className="text-xl font-bold text-green-700">{intern.percentage}%</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InternProgress;
