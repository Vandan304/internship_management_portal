import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Edit2, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { InternModal } from '../components/interns/InternModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AllInterns() {
    const { interns, updateIntern, isLoading } = useData();
    const { addToast } = useToast();

    // State for Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // State for Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIntern, setEditingIntern] = useState(null);
    const [isSubmittingIntern, setIsSubmittingIntern] = useState(false);

    // Compute unique roles for filter dropdown
    const [availableRoles, setAvailableRoles] = useState(['All']);

    useEffect(() => {
        let isMounted = true;
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const res = await axios.get('/api/admin/intern-roles', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success && Array.isArray(res.data.data) && isMounted) {
                        setAvailableRoles(['All', ...res.data.data]);
                    }
                }
            } catch (error) {
                console.error("Error fetching available roles:", error);
            }
        };
        fetchRoles();
        return () => { isMounted = false; };
    }, []);

    // Format date string for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Calculate Internship Status based on End Date
    const getInternshipStatus = (endDate) => {
        if (!endDate) return 'Ongoing'; // Default if null
        const end = new Date(endDate);
        const today = new Date();

        // Normalize times to midnight for accurate day comparison
        end.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return today > end ? 'Completed' : 'Ongoing';
    };

    // Derived list with calculated statuses and filtering applied
    const filteredInterns = useMemo(() => {
        return interns
            .map(intern => ({
                ...intern,
                internshipStatus: getInternshipStatus(intern.endDate)
            }))
            .filter(intern => {
                // Search filter (Name, Email, Intern ID)
                const searchLower = searchQuery.toLowerCase();
                const matchesSearch =
                    (intern.name || '').toLowerCase().includes(searchLower) ||
                    (intern.email || '').toLowerCase().includes(searchLower) ||
                    (intern.internId || '').toLowerCase().includes(searchLower);

                // Role Filter
                const matchesRole = filterRole === 'All' || intern.internRole === filterRole;

                // Status Filter
                const matchesStatus = filterStatus === 'All' || intern.internshipStatus === filterStatus;

                return matchesSearch && matchesRole && matchesStatus;
            })
            // Sort A-Z by name default
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [interns, searchQuery, filterRole, filterStatus]);

    // Dynamic Title logic string
    const getDynamicTitle = () => {
        const roleText = filterRole !== 'All' ? filterRole.charAt(0).toUpperCase() + filterRole.slice(1) : 'All';
        const statusText = filterStatus !== 'All' ? filterStatus : '';

        // Example logic:
        // Role=All, Status=All -> All Intern Data
        // Role=All, Status=Ongoing -> Ongoing Intern Data
        // Role=AI, Status=All -> AI Intern Data
        // Role=AI, Status=Ongoing -> AI Ongoing Intern Data

        const textParts = [];
        if (roleText !== 'All') textParts.push(roleText);
        if (statusText) textParts.push(statusText);

        if (textParts.length === 0) return 'All Intern Data';
        return `${textParts.join(' ')} Intern Data`;
    };

    const handleExportPDF = () => {
        if (filteredInterns.length === 0) {
            addToast('No interns found for selected filters', 'error');
            return;
        }

        try {
            const doc = new jsPDF({ orientation: 'portrait' });
            const title = getDynamicTitle();
            const fileName = title.toLowerCase().replace(/\s+/g, '-') + '.pdf';

            // Layout & Styling
            doc.setFontSize(18);
            doc.setTextColor(33, 33, 33);
            doc.text(title, 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            // Table mapping
            const tableColumn = ["Name", "Email", "Intern ID", "Role", "Start Date", "End Date", "Status"];
            const tableRows = filteredInterns.map(intern => [
                intern.name || 'N/A',
                intern.email || 'N/A',
                intern.internId || 'N/A',
                intern.internRole || 'N/A',
                formatDate(intern.startDate),
                formatDate(intern.endDate),
                intern.internshipStatus
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: [14, 165, 233], textColor: 255 }, // matches brand-500 (sky-500)
                alternateRowStyles: { fillColor: [249, 250, 251] }, // gray-50
                margin: { top: 40 }
            });

            doc.save(fileName);
            addToast('Intern data exported successfully', 'success');
        } catch (error) {
            console.error('PDF Export error:', error);
            addToast('Failed to export PDF data', 'error');
        }
    };

    const handleEditClick = (intern) => {
        setEditingIntern(intern);
        setIsModalOpen(true);
    };

    const handleSubmitIntern = async (data) => {
        setIsSubmittingIntern(true);
        try {
            await updateIntern(editingIntern.id, data);
            addToast('Intern updated successfully', 'success');
            setIsModalOpen(false);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to process intern data';
            addToast(errorMessage, 'error');
        } finally {
            setIsSubmittingIntern(false);
        }
    };

    if (isLoading) return <LoadingSpinner message="Loading all intern records..." />;

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Interns</h2>
                    <p className="text-gray-500 text-sm mt-1">View and export all intern records in the system.</p>
                </div>
                <Button onClick={handleExportPDF} className="bg-sky-600 hover:bg-sky-700">
                    <Download size={18} className="mr-2" />
                    Export PDF
                </Button>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0 bg-white border-b border-gray-100">
                    <div className="relative w-full sm:w-72">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Role:</span>
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-gray-50 cursor-pointer min-w-[120px]"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                {availableRoles.map(role => (
                                    <option key={role} value={role}>
                                        {role === 'All' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-gray-50 cursor-pointer min-w-[130px]"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto flex-1 bg-white">
                    <div className="min-w-full">
                        <table className="min-w-[1000px] w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-4 font-medium tracking-wider">Intern</th>
                                    <th className="px-4 py-4 font-medium tracking-wider">Intern ID</th>
                                    <th className="px-4 py-4 font-medium tracking-wider">Role</th>
                                    <th className="px-4 py-4 font-medium tracking-wider">Start Date</th>
                                    <th className="px-4 py-4 font-medium tracking-wider">End Date</th>
                                    <th className="px-4 py-4 font-medium tracking-wider">Internship Status</th>
                                    <th className="px-4 py-4 font-medium tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInterns.map((intern) => (
                                    <tr key={intern.id} className="hover:bg-sky-50/30 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">
                                                    {intern.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">{intern.email || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="text-xs font-mono font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-100">
                                                {intern.internId || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                                {intern.internRole || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                                            {formatDate(intern.startDate)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                                            {formatDate(intern.endDate)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${intern.internshipStatus === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${intern.internshipStatus === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`} />
                                                {intern.internshipStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleEditClick(intern)}
                                                className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors ml-auto"
                                                title="Edit Intern"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredInterns.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Search className="h-8 w-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No interns found</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
                                    We couldn't find any intern records matching your current filter criteria.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Reused Edit Modal */}
            <InternModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitIntern}
                initialData={editingIntern}
                isLoading={isSubmittingIntern}
            />
        </div>
    );
}