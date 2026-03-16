import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Plus, Filter, Edit2, Trash2, FileText, FileCheck, Shield, ShieldOff } from 'lucide-react';
import { cn } from '../utils/cn';
import { InternModal } from '../components/interns/InternModal';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';

export default function Interns() {
    const { interns, addIntern, updateIntern, deleteIntern, blockIntern, activateIntern, generateCompletionCertificate, generateOfferLetter } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIntern, setEditingIntern] = useState(null);
    const { addToast } = useToast();

    const filteredInterns = interns.filter(intern => {
        const matchesSearch = intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            intern.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'All' || intern.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const toggleLoginStatus = async (id) => {
        const intern = interns.find(i => i.id === id);
        try {
            if (intern.loginAllowed) {
                await blockIntern(id);
                addToast(`Login blocked for ${intern.name}`, 'info');
            } else {
                await activateIntern(id);
                addToast(`Login allowed for ${intern.name}`, 'success');
            }
        } catch (error) {
            addToast('Failed to update login status', 'error');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await updateIntern(id, { isActive: !currentStatus });
            addToast(`Intern ${!currentStatus ? 'activated' : 'deactivated'} successfully`, "success");
        } catch {
            addToast("Failed to update intern status", "error");
        }
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
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Intern Details</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Login Access</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Offer Letter</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Completion Certificate</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredInterns.map((intern) => (
                                    <tr key={intern.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100/50">
                                                    {intern.name?.[0]?.toUpperCase() || 'I'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{intern.name}</div>
                                                    <div className="text-xs text-gray-500">{intern.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {intern.internRole}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${intern.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${intern.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {intern.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={intern.loginAllowed}
                                                    onChange={() => toggleLoginStatus(intern.id)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {intern.status === 'Active' && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await generateOfferLetter(intern.id);
                                                            addToast('Offer Letter Generated Successfully', 'success');
                                                        } catch (err) {
                                                            const message = err.response?.data?.message || 'Failed to generate Offer Letter';
                                                            addToast(message, err.response?.status === 400 ? 'info' : 'error');
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                                                    title="Offer Letter"
                                                >
                                                    <FileCheck size={16} />
                                                    <span>Offer Letter</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {intern.status === 'Active' && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await generateCompletionCertificate(intern.id);
                                                            addToast('Completion Certificate Generated Successfully', 'success');
                                                        } catch (err) {
                                                            const message = err.response?.data?.message || 'Failed to generate Completion Certificate';
                                                            addToast(message, err.response?.status === 400 ? 'info' : 'error');
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                                                    title="Completion Certificate"
                                                >
                                                    <FileText size={16} />
                                                    <span>Completion Certificate</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setEditingIntern(intern);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Intern"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(intern.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Intern"
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
