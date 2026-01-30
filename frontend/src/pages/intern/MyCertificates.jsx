import React, { useState } from 'react';
import { Award, Eye, Download, Search, Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const MyCertificates = () => {
    const { certificates } = useData();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter certificates assigned to this user
    // And ensure visibility is Public OR assigned
    // Actually, usually if assigned, you can see it. But let's check visibility too if needed.
    // Requirement says "Hidden certificates should not appear".
    // AND "Show certificates assigned by admin". 
    // Let's assume: If assigned, it shows up unless visibility is 'Private' AND not assigned? 
    // No, usually Assignment overrides visibility, or Visibility hides it from everyone.
    // Let's assume: If assigned to ME, I can see it. If visibility is Private, maybe I can't?
    // Let's go with: If assigned to ME, I see it.

    const myCertificates = certificates.filter(cert =>
        cert.assignments && cert.assignments.some(a => a.internId === user.id)
    ).map(cert => {
        const assignment = cert.assignments.find(a => a.internId === user.id);
        return {
            ...cert,
            canDownload: assignment.canDownload
        };
    });

    const filteredCertificates = myCertificates.filter(cert =>
        cert.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
                    <p className="text-gray-500">View and download your earned certificates</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search certificates..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Certificates Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCertificates.map((cert) => (
                                <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-brand-100 rounded-lg text-brand-600">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{cert.name}</div>
                                                <div className="text-xs text-gray-500">ID: CERT-{cert.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {cert.uploadedDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cert.canDownload ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {cert.canDownload ? 'Downloadable' : 'View Only'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-gray-400 hover:text-brand-600 transition-colors" title="Preview">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            {cert.canDownload && (
                                                <button className="p-2 text-gray-400 hover:text-brand-600 transition-colors" title="Download">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Empty State */}
                {filteredCertificates.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No certificates found</h3>
                        <p className="text-gray-500 mt-2">You haven't been assigned any certificates yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCertificates;
