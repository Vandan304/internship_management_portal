import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Search, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

export default function Permissions() {
    const [permissions, setPermissions] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const fetchPermissions = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get('/api/certificates/permissions');
            if (res.data.success) {
                setPermissions(res.data.certificates);
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
            addToast("Failed to load permissions", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const filteredPermissions = permissions.filter(p =>
        (p.intern?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.title || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleDownload = async (certId, currentStatus) => {
        try {
            const res = await axios.patch(`/api/certificates/${certId}/download`);
            if (res.data.success) {
                setPermissions(perms => perms.map(p =>
                    p._id === certId ? { ...p, canDownload: !currentStatus } : p
                ));
                addToast(`Download permission ${!currentStatus ? 'granted' : 'revoked'}`, 'success');
            }
        } catch (error) {
            console.error("Error toggling download:", error);
            addToast("Failed to toggle download permission", "error");
        }
    };

    const handleToggleVisibility = async (certId, currentStatus) => {
        try {
            const res = await axios.patch(`/api/certificates/${certId}/visibility`);
            if (res.data.success) {
                setPermissions(perms => perms.map(p =>
                    p._id === certId ? { ...p, isVisible: !currentStatus } : p
                ));
                addToast(`Visibility set to ${!currentStatus ? 'visible' : 'hidden'}`, 'success');
            }
        } catch (error) {
            console.error("Error toggling visibility:", error);
            addToast("Failed to toggle visibility", "error");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Download Permissions</h2>
                    <p className="text-gray-500 text-sm mt-1">Control which certificates interns can view and download.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by intern or certificate..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Intern</th>
                                    <th className="px-6 py-4 font-medium">Certificate File</th>
                                    <th className="px-6 py-4 font-medium text-center">Visibility</th>
                                    <th className="px-6 py-4 font-medium text-center">Download Access</th>
                                    <th className="px-6 py-4 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            Loading permissions...
                                        </td>
                                    </tr>
                                ) : filteredPermissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No assigned certificates found. Go to 'Certificates' to upload and assign them.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPermissions.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {item.intern ? item.intern.name : 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.title}</td>

                                            {/* Visibility Toggle */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleVisibility(item._id, item.isVisible)}
                                                        className={cn(
                                                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                                                            item.isVisible ? 'bg-brand-600' : 'bg-gray-200'
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                                item.isVisible ? 'translate-x-5' : 'translate-x-0'
                                                            )}
                                                        />
                                                    </button>
                                                    {item.isVisible ? <Eye size={16} className="text-brand-600" /> : <EyeOff size={16} className="text-gray-400" />}
                                                </div>
                                            </td>

                                            {/* Download Toggle */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleToggleDownload(item._id, item.canDownload)}
                                                        className={cn(
                                                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                                                            item.canDownload ? 'bg-green-600' : 'bg-gray-200'
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                                item.canDownload ? 'translate-x-5' : 'translate-x-0'
                                                            )}
                                                        />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    item.canDownload ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                                )}>
                                                    {item.canDownload ? <CheckCircle size={12} /> : <Lock size={12} />}
                                                    {item.canDownload ? 'Downloadable' : 'Restricted'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
