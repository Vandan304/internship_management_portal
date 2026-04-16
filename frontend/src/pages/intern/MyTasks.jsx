import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { SubmitTaskModal } from '../../components/intern/SubmitTaskModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MyTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/tasks/my-tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setTasks(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const openSubmitModal = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending':
                return { label: 'Pending', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' };
            case 'submitted':
                return { label: 'Submitted', icon: Upload, color: 'text-blue-600', bg: 'bg-blue-100' };
            case 'approved':
                return { label: 'Approved', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
            case 'rejected':
                return { label: 'Rejected', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
            default:
                return { label: 'Unknown', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                    <p className="text-gray-500">View your assigned tasks and submit your work.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Info</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-0">
                                        <LoadingSpinner message="Loading your tasks..." />
                                    </td>
                                </tr>
                            ) : tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                                        You have no tasks assigned yet.
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => {
                                    const st = getStatusConfig(task.status);
                                    const StatusIcon = st.icon;
                                    const isOverdue = new Date(task.deadline) < new Date();
                                    const showOverdueWarning = isOverdue && (task.status === 'pending' || task.status === 'rejected');

                                    return (
                                        <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                                <div className="text-xs text-gray-500">Week {task.weekNumber}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 max-w-xs truncate" title={task.description}>
                                                    {task.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm ${showOverdueWarning ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                                                    {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at 11:59 PM
                                                </div>
                                                {showOverdueWarning && <div className="text-xs text-red-500">Overdue</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {(task.status === 'pending' || task.status === 'rejected') && !isOverdue && (
                                                    <button
                                                        onClick={() => openSubmitModal(task)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        {task.status === 'rejected' ? 'Resubmit Task' : 'Submit Task'}
                                                    </button>
                                                )}
                                                {(task.status === 'pending' || task.status === 'rejected') && isOverdue && (
                                                    <span className="text-red-500 text-sm flex items-center justify-end gap-1">
                                                        <AlertCircle className="w-4 h-4" /> Submission Closed
                                                    </span>
                                                )}
                                                {task.status === 'submitted' && (
                                                    <span className="text-gray-500 text-sm">Awaiting Review</span>
                                                )}
                                                {task.status === 'approved' && (
                                                    <span className="text-green-600 text-sm flex items-center justify-end gap-1">
                                                        <CheckCircle className="w-4 h-4" /> Done
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SubmitTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
                onTaskSubmitted={fetchTasks}
            />
        </div>
    );
};

export default MyTasks;
