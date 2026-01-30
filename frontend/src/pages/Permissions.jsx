import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Lock, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';

export default function Permissions() {
    const { certificates, interns, toggleDownloadPermission } = useData();
    const [search, setSearch] = useState('');
    const { addToast } = useToast();

    // Flatten permissions for display
    // Each row represents an assignment of a certificate to an intern
    const permissions = certificates.flatMap(cert =>
        (cert.assignments || []).map(assign => {
            const intern = interns.find(i => i.id === assign.internId);
            return {
                id: `${cert.id}-${assign.internId}`,
                certId: cert.id,
                internId: assign.internId,
                internName: intern ? intern.name : 'Unknown Intern',
                certificateName: cert.name,
                canDownload: assign.canDownload
            };
        })
    );

    const filteredPermissions = permissions.filter(p =>
        p.internName.toLowerCase().includes(search.toLowerCase()) ||
        p.certificateName.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = (certId, internId, currentStatus) => {
        toggleDownloadPermission(certId, internId);
        addToast(`Permission ${!currentStatus ? 'granted' : 'revoked'}`, 'info');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Download Permissions</h2>
                    <p className="text-gray-500 text-sm mt-1">Control which certificates interns can download.</p>
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
                                    <th className="px-6 py-4 font-medium text-center">Download Access</th>
                                    <th className="px-6 py-4 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPermissions.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.internName}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.certificateName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleToggle(item.certId, item.internId, item.canDownload)}
                                                    className={cn(
                                                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                                                        item.canDownload ? 'bg-brand-600' : 'bg-gray-200'
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
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                item.canDownload ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                            )}>
                                                {item.canDownload ? <CheckCircle size={12} /> : <Lock size={12} />}
                                                {item.canDownload ? 'Granted' : 'Restricted'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPermissions.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            No assigned certificates found. Go to 'Certificates' to assign them.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
