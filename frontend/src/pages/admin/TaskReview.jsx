import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Download, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { BASE_URL } from '../../utils/urlUtils';
import LoadingSpinner from '../../components/common/LoadingSpinner';
const TaskReview = () => {
    const { addToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [reviewComment, setReviewComment] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                // Filter to only show tasks that are submitted, approved, or rejected
                const reviewableTasks = res.data.data.filter(t => t.status !== 'pending');
                setTasks(reviewableTasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            addToast('Failed to fetch tasks', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleReviewSubmit = async (status) => {
        if (status === 'reject' && !reviewComment) {
            addToast('Please provide a comment for rejection', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/tasks/${selectedTask._id}/${status}`, { comment: reviewComment }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast(`Task ${status === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
            setIsReviewModalOpen(false);
            setSelectedTask(null);
            setReviewComment('');
            fetchTasks(); // Refresh list
        } catch (error) {
            console.error(`Error ${status} task:`, error);
            addToast(error.response?.data?.message || `Failed to ${status} task`, 'error');
        }
    };

    const openReviewModal = (task) => {
        setSelectedTask(task);
        setReviewComment(task.reviewComment || '');
        setIsReviewModalOpen(true);
    };

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Task Review</h1>
                    <p className="text-gray-500">Review intern submissions, download files, and approve/reject tasks.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search submissions by task or intern name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task / Intern</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted On</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-0">
                                        <LoadingSpinner message="Loading submissions..." />
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">No submissions found.</td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{task.title} (Week {task.weekNumber})</div>
                                            <div className="text-xs text-gray-500">{task.assignedTo?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{task.submittedAt ? new Date(task.submittedAt).toLocaleDateString() : '-'}</div>
                                            <div className="text-xs text-gray-500">{task.submittedAt ? new Date(task.submittedAt).toLocaleTimeString() : ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                                ${task.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    task.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
                                            >
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openReviewModal(task)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {isReviewModalOpen && selectedTask && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Review Submission</h3>
                            <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl p-1 leading-none">&times;</button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <h4 className="text-md font-bold text-gray-900">{selectedTask.title}</h4>
                                <p className="text-sm text-gray-500">Submitted by: {selectedTask.assignedTo?.name}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Task Submission ZIP</p>
                                        <p className="text-xs text-gray-500">Submitted on {new Date(selectedTask.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.open(`${BASE_URL}/api/files/${selectedTask._id}?token=${localStorage.getItem('token')}`, '_blank')}
                                    className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                                >
                                    Download
                                </button>
                            </div>

                            {selectedTask.status === 'submitted' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback/Comment (Optional for Approval)</label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={e => setReviewComment(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        rows="3"
                                        placeholder="Add a comment to give feedback..."
                                    ></textarea>
                                </div>
                            )}

                            {selectedTask.status !== 'submitted' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Provided:</label>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 items-center rounded-lg border border-gray-200">
                                        {selectedTask.reviewComment || 'No feedback provided.'}
                                    </p>
                                </div>
                            )}

                            {selectedTask.status === 'submitted' ? (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => handleReviewSubmit('reject')}
                                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleReviewSubmit('approve')}
                                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-end pt-2">
                                    <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TaskReview;
