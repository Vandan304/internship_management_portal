import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Filter, Trash2, Edit2, ListTodo, CheckCircle, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/ui/ConfirmModal';

const TaskManagement = () => {
    const { addToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [interns, setInterns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [editDeadline, setEditDeadline] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [specificDateFilter, setSpecificDateFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');

    const openEditModal = (task) => {
        setTaskToEdit(task);
        setEditDeadline(new Date(task.deadline).toISOString().split('T')[0]);
        setIsEditModalOpen(true);
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openDeleteModal = (task) => {
        setTaskToDelete(task);
        setIsDeleteModalOpen(true);
    };

    const handleUpdateDeadline = async (e) => {
        e.preventDefault();
        if (!taskToEdit || !editDeadline) return;

        try {
            setIsUpdating(true);
            const token = localStorage.getItem('token');
            const res = await axios.patch(`/api/tasks/${taskToEdit._id}/deadline`, { deadline: editDeadline }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                addToast(res.data.message, 'success');
                setTasks(prev => prev.map(t => t._id === taskToEdit._id ? res.data.data : t));
                setIsEditModalOpen(false);
            }
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to update deadline", 'error');
        } finally {
            setIsUpdating(false);
        }
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [deadlineFilter, setDeadlineFilter] = useState('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        weekNumber: '',
        deadline: ''
    });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [tasksRes, internsRes] = await Promise.all([
                axios.get('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/interns', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (tasksRes.data.success) setTasks(tasksRes.data.data);
            if (internsRes.data.success) setInterns(internsRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Failed to fetch data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/tasks', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast('Task created successfully', 'success');
            setIsCreateModalOpen(false);
            setFormData({ title: '', description: '', assignedTo: '', weekNumber: '', deadline: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating task:', error);
            addToast(error.response?.data?.message || 'Failed to create task', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/tasks/${taskToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast('Task deleted successfully', 'success');
            setTasks(prev => prev.filter(t => t._id !== taskToDelete._id));
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        } catch (error) {
            console.error('Error deleting task:', error);
            addToast(error.response?.data?.message || 'Failed to delete task', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesDeadline = true;
        if (specificDateFilter) {
            const selectedDate = new Date(specificDateFilter);
            selectedDate.setHours(0, 0, 0, 0);
            const taskDate = new Date(task.deadline);
            taskDate.setHours(0, 0, 0, 0);
            matchesDeadline = taskDate.getTime() === selectedDate.getTime();
        } else if (monthFilter) {
            const taskDate = new Date(task.deadline);
            const [filterYear, filterMonth] = monthFilter.split('-');
            if (filterYear && filterMonth) {
                matchesDeadline = taskDate.getFullYear() === parseInt(filterYear, 10) && 
                               (taskDate.getMonth() + 1) === parseInt(filterMonth, 10);
            }
        } else if (deadlineFilter !== 'All') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const taskDate = new Date(task.deadline);
            taskDate.setHours(0, 0, 0, 0);

            if (deadlineFilter === 'Today') {
                matchesDeadline = taskDate.getTime() === today.getTime();
            } else if (deadlineFilter === '1-Day') {
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                matchesDeadline = taskDate.getTime() >= today.getTime() && taskDate.getTime() <= tomorrow.getTime();
            }
        }

        const matchesStatus = statusFilter === 'All' || task.status === statusFilter;

        return matchesSearch && matchesDeadline && matchesStatus;
    });

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                    <p className="text-gray-500">Assign and manage intern tasks.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Assign New Task
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row flex-wrap gap-4 flex-shrink-0">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        value={deadlineFilter}
                        onChange={(e) => {
                            setDeadlineFilter(e.target.value);
                            if (e.target.value !== 'All') {
                                setSpecificDateFilter('');
                                setMonthFilter('');
                            }
                        }}
                    >
                        <option value="All">All Deadlines</option>
                        <option value="Today">Today</option>
                        <option value="1-Day">Within 1 Day</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="pending">Pending / Not Submitted</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="month"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        value={monthFilter}
                        onChange={(e) => {
                            setMonthFilter(e.target.value);
                            if (e.target.value) {
                                setSpecificDateFilter('');
                                setDeadlineFilter('All');
                            }
                        }}
                        title="Filter Tasks by Month"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        value={specificDateFilter}
                        onChange={(e) => {
                            setSpecificDateFilter(e.target.value);
                            if (e.target.value) {
                                setMonthFilter('');
                                setDeadlineFilter('All');
                            }
                        }}
                        title="Filter Tasks by Date"
                    />
                </div>
                {(searchTerm || statusFilter !== 'All' || deadlineFilter !== 'All' || specificDateFilter || monthFilter) && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('All');
                            setDeadlineFilter('All');
                            setSpecificDateFilter('');
                            setMonthFilter('');
                        }}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium px-2"
                    >
                        Reset Filters
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Info</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Intern</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Week</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-0">
                                        <LoadingSpinner message="Loading tasks..." />
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">No tasks found.</td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{task.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{task.assignedTo?.name}{task.assignedTo?.internId ? ` (${task.assignedTo.internId})` : ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">Week {task.weekNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-gray-500">{new Date(task.deadline).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const isOverdue = task.status === 'pending' && new Date(task.deadline) < new Date();
                                                const statusLabel = isOverdue ? 'Not Submitted' : task.status;
                                                const statusColor = isOverdue ? 'bg-red-100 text-red-800' :
                                                                  task.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                  task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                  task.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
                                                
                                                return (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor}`}>
                                                        {statusLabel}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(task)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                                                    disabled={isUpdating}
                                                >
                                                    <Clock className="w-4 h-4" />
                                                    Edit Deadline
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(task)}
                                                    className={`p-1.5 rounded-lg transition-colors ${task.status !== 'approved' ? 'text-gray-400 bg-gray-50 cursor-not-allowed pointer-events-none' : 'text-red-600 hover:bg-red-50'}`}
                                                    disabled={task.status !== 'approved'}
                                                    title={task.status !== 'approved' ? "Can only delete approved tasks" : "Delete Task"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Task Modal - Portaled to document.body */}
            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Assign New Task</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none rows-3"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select required value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none">
                                    <option value="">Select Intern</option>
                                    {interns.map(i => <option key={i._id} value={i._id}>{i.name}{i.internId ? ` (${i.internId})` : ''}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Week Number</label>
                                    <input type="number" min="1" required value={formData.weekNumber} onChange={e => setFormData({ ...formData, weekNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.deadline} 
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })} 
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none" 
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" disabled={isCreating} onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isCreating} className="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                                    {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isCreating ? 'Assigning...' : 'Assign Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Deadline Modal - Portaled to document.body */}
            {isEditModalOpen && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden text-left">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900 text-left w-full">Update Deadline</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateDeadline} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2 truncate">Task: {taskToEdit?.title}</p>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Deadline</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={editDeadline} 
                                    onChange={e => setEditDeadline(e.target.value)} 
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none" 
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" disabled={isUpdating} onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                                    {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isUpdating ? 'Updating...' : 'Update Deadline'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setTaskToDelete(null);
                }}
                onConfirm={handleDeleteTask}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the task "${taskToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete Task"
                type="danger"
                isLoading={isDeleting}
                loadingText="Deleting..."
            />
        </div>
    );
};

export default TaskManagement;
