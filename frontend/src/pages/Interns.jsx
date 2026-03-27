import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Plus, Filter, Edit2, Trash2, FileText, FileCheck, Shield, ShieldOff, Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { InternModal } from '../components/interns/InternModal';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';

import medal1 from '../assets/medals/medal_1.png';
import medal2 from '../assets/medals/medal_2.png';
import medal3 from '../assets/medals/medal_3.png';

const medalMap = {
    1: medal1,
    2: medal2,
    3: medal3
};
import ConfirmModal from '../components/ui/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Interns() {
    const { interns, leaderboardData, addIntern, updateIntern, deleteIntern, blockIntern, activateIntern, generateCompletionCertificate, generateOfferLetter, isLoading } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [sortOrder, setSortOrder] = useState('Name A-Z');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIntern, setEditingIntern] = useState(null);
    const { addToast } = useToast();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [internToDelete, setInternToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmittingIntern, setIsSubmittingIntern] = useState(false);
    const [processingAction, setProcessingAction] = useState({ id: null, type: null }); // { id, type: 'toggle' | 'offer' | 'cert' }

    const filteredInterns = interns
        .map(intern => ({
            ...intern,
            status: intern.status || (intern.isActive ? 'Active' : 'Inactive')
        }))
        .filter(intern => {
            const matchesSearch = intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                intern.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (intern.internId || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'All' || intern.status === filterStatus;
            const matchesRole = filterRole === 'All' || intern.internRole === filterRole;
            return matchesSearch && matchesStatus && matchesRole;
        })
        .sort((a, b) => {
            if (sortOrder === 'Name A-Z') return a.name.localeCompare(b.name);
            if (sortOrder === 'Name Z-A') return b.name.localeCompare(a.name);
            return 0;
        });

    const toggleLoginStatus = async (id) => {
        const intern = interns.find(i => i.id === id);
        setProcessingAction({ id, type: 'toggle' });
        try {
            if (intern.loginAccess) {
                await blockIntern(id);
                addToast(`Login blocked for ${intern.name}`, 'info');
            } else {
                await activateIntern(id);
                addToast(`Login allowed for ${intern.name}`, 'success');
            }
        } catch (error) {
            addToast('Failed to update login status', 'error');
        } finally {
            setProcessingAction({ id: null, type: null });
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

    const handleDeleteClick = (id) => {
        setInternToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (internToDelete) {
            setIsDeleting(true);
            try {
                await deleteIntern(internToDelete);
                addToast('Intern deleted successfully', 'error');
                setIsDeleteModalOpen(false);
                setInternToDelete(null);
            } catch (error) {
                addToast('Failed to delete intern', 'error');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleAddIntern = () => {
        setEditingIntern(null);
        setIsModalOpen(true);
    };

    const handleSubmitIntern = async (data) => {
        setIsSubmittingIntern(true);
        try {
            if (editingIntern) {
                await updateIntern(editingIntern.id, data);
                addToast('Intern updated successfully', 'success');
            } else {
                await addIntern(data);
                addToast('New intern created successfully', 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to process intern data';
            addToast(errorMessage, 'error');
        } finally {
            setIsSubmittingIntern(false);
        }
    };

    if (isLoading) return <LoadingSpinner message="Loading intern directory..." />;

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Intern Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage intern accounts, access, and details.</p>
                </div>
                <Button onClick={handleAddIntern}>
                    <Plus size={18} className="mr-2" />
                    Add New Intern
                </Button>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">
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
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive Only</option>
                        </select>
                        <select
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="All">All Roles</option>
                            <option value="fullstack">Fullstack</option>
                            <option value="frontend">Frontend</option>
                            <option value="backend">Backend</option>
                            <option value="ai">AI</option>
                            <option value="ml">ML</option>
                            <option value="datascience">Data Science</option>
                        </select>
                        <select
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="Name A-Z">Name A-Z</option>
                            <option value="Name Z-A">Name Z-A</option>
                        </select>
                        <Button variant="secondary" size="sm" className="hidden sm:flex">
                            <Filter size={16} className="mr-2" /> Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-auto flex-1">
                    <div className="min-w-full">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
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
                                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                                        {intern.name}{intern.internId ? ` (${intern.internId})` : ''}
                                                        {(() => {
                                                            const rankInfo = leaderboardData?.fullList?.find(l => l.id === (intern._id || intern.id) || l.internId === intern.internId);
                                                            if (rankInfo && rankInfo.rank <= 3) {
                                                                return (
                                                                    <img 
                                                                        src={medalMap[rankInfo.rank]} 
                                                                        alt={`Rank ${rankInfo.rank}`} 
                                                                        className="w-4 h-4 object-contain"
                                                                    />
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                   </div>
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
                                            <div className="relative inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    disabled={processingAction.id === intern.id && processingAction.type === 'toggle'}
                                                    checked={intern.loginAccess}
                                                    onChange={() => toggleLoginStatus(intern.id)}
                                                />
                                                <div className={cn(
                                                    "w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600",
                                                    processingAction.id === intern.id && processingAction.type === 'toggle' && "opacity-50 cursor-not-allowed"
                                                )}></div>
                                                {processingAction.id === intern.id && processingAction.type === 'toggle' && (
                                                    <Loader2 className="w-3 h-3 animate-spin absolute right-[-1.25rem] text-blue-600" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {intern.status === 'Active' && (
                                                <button
                                                    disabled={!intern.loginAccess || (processingAction.id === intern.id && processingAction.type === 'offer')}
                                                    onClick={async () => {
                                                        if (!intern.loginAccess) {
                                                            addToast('Enable login access before generating offer letter', 'error');
                                                            return;
                                                        }
                                                        if (intern.offerLetterAssigned) {
                                                            addToast('Offer letter is already generated!', 'info');
                                                            return;
                                                        }
                                                        setProcessingAction({ id: intern.id, type: 'offer' });
                                                        try {
                                                            addToast('Generating Offer Letter...', 'info');
                                                            await generateOfferLetter(intern.id);
                                                            addToast('Offer Letter Generated Successfully', 'success');
                                                        } catch (err) {
                                                            const message = err.response?.data?.message || 'Failed to generate Offer Letter';
                                                            addToast(message, err.response?.status === 403 || err.response?.status === 400 ? 'info' : 'error');
                                                        } finally {
                                                            setProcessingAction({ id: null, type: null });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium",
                                                        intern.loginAccess 
                                                            ? "text-gray-400 hover:text-blue-600 hover:bg-blue-50" 
                                                            : "text-gray-300 cursor-not-allowed opacity-50"
                                                    )}
                                                    title={intern.loginAccess ? "Offer Letter" : "Login access required"}
                                                >
                                                    {processingAction.id === intern.id && processingAction.type === 'offer' 
                                                        ? <Loader2 size={16} className="animate-spin" /> 
                                                        : <FileCheck size={16} />}
                                                    <span>{processingAction.id === intern.id && processingAction.type === 'offer' ? 'Generating...' : 'Offer Letter'}</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {intern.status === 'Active' && (
                                                <button
                                                    disabled={!intern.loginAccess || (processingAction.id === intern.id && processingAction.type === 'cert')}
                                                    onClick={async () => {
                                                        if (!intern.loginAccess) {
                                                            addToast('Enable login access before generating certificate', 'error');
                                                            return;
                                                        }
                                                        if (intern.certificateAssigned) {
                                                            addToast('Completion certificate is already generated!', 'info');
                                                            return;
                                                        }
                                                        setProcessingAction({ id: intern.id, type: 'cert' });
                                                        try {
                                                            addToast('Generating Completion Certificate...', 'info');
                                                            await generateCompletionCertificate(intern.id);
                                                            addToast('Completion Certificate Generated Successfully', 'success');
                                                        } catch (err) {
                                                            const message = err.response?.data?.message || 'Failed to generate Completion Certificate';
                                                            addToast(message, err.response?.status === 403 || err.response?.status === 400 ? 'info' : 'error');
                                                        } finally {
                                                            setProcessingAction({ id: null, type: null });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium",
                                                        intern.loginAccess 
                                                            ? "text-gray-400 hover:text-green-600 hover:bg-green-50" 
                                                            : "text-gray-300 cursor-not-allowed opacity-50"
                                                    )}
                                                    title={intern.loginAccess ? "Completion Certificate" : "Login access required"}
                                                >
                                                    {processingAction.id === intern.id && processingAction.type === 'cert' 
                                                        ? <Loader2 size={16} className="animate-spin" /> 
                                                        : <FileText size={16} />}
                                                    <span>{processingAction.id === intern.id && processingAction.type === 'cert' ? 'Generating...' : 'Completion Certificate'}</span>
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
                                                    onClick={() => handleDeleteClick(intern.id)}
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
                isLoading={isSubmittingIntern}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Intern Deletion"
                message="Are you sure you want to delete this intern? This will permanently remove their records and all assigned certificates."
                confirmText="Delete Now"
                cancelText="Keep Intern"
                type="danger"
                isLoading={isDeleting}
                loadingText="Deleting..."
            />
        </div>
    );
}
