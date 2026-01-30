import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Plus, Filter, MoreVertical, Shield, ShieldOff, Edit, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { InternModal } from '../components/interns/InternModal';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';

export default function Interns() {
    // Access global state from DataContext
    const { interns, addIntern, updateIntern, deleteIntern } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIntern, setEditingIntern] = useState(null);
    const { addToast } = useToast();

    // Filtering Logic
    const filteredInterns = interns.filter(intern => {
        const matchesSearch = intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            intern.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'All' || intern.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Handlers
    const toggleLoginStatus = (id) => {
        const intern = interns.find(i => i.id === id);
        updateIntern(id, { loginAllowed: !intern.loginAllowed });
        addToast(`Login ${!intern.loginAllowed ? 'allowed' : 'blocked'} for ${intern.name}`, 'info');
    };

    const toggleStatus = (id) => {
        const intern = interns.find(i => i.id === id);
        const newStatus = intern.status === 'Active' ? 'Inactive' : 'Active';
        updateIntern(id, { status: newStatus });
        addToast(`${intern.name} is now ${newStatus}`, 'success');
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this intern? This will remove all their assigned certificates.')) {
            deleteIntern(id);
            addToast('Intern deleted successfully', 'error');
        }
    }

    const handleAddIntern = () => {
        setEditingIntern(null);
        setIsModalOpen(true);
    };

    const handleEditIntern = (intern) => {
        setEditingIntern(intern);
        setIsModalOpen(true);
    };

    const handleSubmitIntern = (data) => {
        if (editingIntern) {
            updateIntern(editingIntern.id, data);
            addToast('Intern updated successfully', 'success');
        } else {
            addIntern(data);
            addToast('New intern created successfully', 'success');
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Intern Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage intern accounts, access, and details.</p>
                </div>
                <Button onClick={handleAddIntern}>
                    <Plus size={18} className="mr-2" />
                    Add New Intern
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search interns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <Button variant="secondary" size="sm" className="hidden sm:flex">
                            <Filter size={16} className="mr-2" /> Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Intern Details</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Login Access</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInterns.map((intern) => (
                                    <tr key={intern.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                                                    {intern.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{intern.name}</p>
                                                    <p className="text-xs text-gray-500">{intern.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{intern.role}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(intern.id)}
                                                className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors",
                                                    intern.status === 'Active'
                                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                                )}
                                            >
                                                {intern.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleLoginStatus(intern.id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 text-xs font-medium transition-colors",
                                                    intern.loginAllowed ? "text-blue-600 hover:text-blue-700" : "text-red-500 hover:text-red-600"
                                                )}
                                            >
                                                {intern.loginAllowed ? <Shield size={14} /> : <ShieldOff size={14} />}
                                                {intern.loginAllowed ? 'Allowed' : 'Blocked'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditIntern(intern)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(intern.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredInterns.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No interns found matching your criteria.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <InternModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitIntern}
                initialData={editingIntern}
            />
        </div>
    );
}
