import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Upload, FileText, Globe, EyeOff, Search, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';

export default function Certificates() {
    const { certificates, interns, addCertificate, deleteCertificate, toggleCertificateVisibility, toggleDownloadPermission } = useData();
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedInternId, setSelectedInternId] = useState('');
    const [certNameInput, setCertNameInput] = useState('');
    const fileInputRef = useRef(null);
    const { addToast } = useToast();

    // Stats Helper
    const getAssignedCount = (cert) => cert.assignedTo ? 1 : 0; // Backend currently assigns 1:1

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const processFile = async (file) => {
        if (!selectedInternId) {
            addToast('Please select an intern to assign this certificate to before uploading.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', certNameInput.trim() ? certNameInput : file.name.split('.')[0]);
        formData.append('assignedTo', selectedInternId);
        formData.append('isVisible', 'false'); // default hidden initially
        formData.append('canDownload', 'false'); // default no download
        formData.append('file', file);

        try {
            await addCertificate(formData);
            setCertNameInput('');
            setSelectedInternId('');
            addToast(`Uploaded successfully`, 'success');
        } catch (e) {
            addToast('Upload failed', 'error');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Delete this certificate?')) {
            deleteCertificate(id);
            addToast('Certificate deleted', 'error');
        }
    };

    const toggleVisibility = async (id) => {
        try {
            await toggleCertificateVisibility(id);
            addToast('Visibility updated', 'info');
        } catch (e) {
            addToast('Failed to update visibility', 'error');
        }
    };

    const toggleDownload = async (id) => {
        try {
            await toggleDownloadPermission(id);
            addToast('Download permission updated', 'info');
        } catch (e) {
            addToast('Failed to update permission', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Certificate Control</h2>
                    <p className="text-gray-500 text-sm mt-1">Upload and assign certificates to interns.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Upload Certificate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                                isDragOver ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.jpg,.png,.jpeg"
                            />
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                                <Upload size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Name</label>
                                <input
                                    type="text"
                                    value={certNameInput}
                                    onChange={(e) => setCertNameInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="e.g. Completion Certificate (Optional)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Intern <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    value={selectedInternId}
                                    onChange={(e) => setSelectedInternId(e.target.value)}
                                >
                                    <option value="">-- Select an active Intern --</option>
                                    {interns.filter(i => i.status === 'Active').map(intern => (
                                        <option key={intern.id} value={intern.id}>{intern.name} ({intern.email})</option>
                                    ))}
                                </select>
                            </div>
                            <Button className="w-full" onClick={() => fileInputRef.current?.click()}>Select File & Upload</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>All Certificates</CardTitle>
                        <div className="relative w-48 hidden sm:block">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">File Name</th>
                                        <th className="px-6 py-3 font-medium">Uploaded</th>
                                        <th className="px-6 py-3 font-medium">Assigned Count</th>
                                        <th className="px-6 py-3 font-medium">Visibility</th>
                                        <th className="px-6 py-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {certificates.map((cert) => (
                                        <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <FileText size={20} className="text-red-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 line-clamp-1 max-w-[150px]">{cert.name}</p>
                                                        <p className="text-xs text-brand-600 mt-0.5">Assigned to: {cert.assignedTo?.name || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{cert.uploadedDate}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleDownload(cert.id)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                                                        cert.canDownload ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-700 hover:bg-red-100"
                                                    )}
                                                >
                                                    {cert.canDownload ? 'Allowed' : 'Blocked'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleVisibility(cert.id)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                                                        cert.visibility === 'Public' ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    )}
                                                >
                                                    {cert.visibility === 'Public' ? <Globe size={12} /> : <EyeOff size={12} />}
                                                    {cert.visibility}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a href={`http://localhost:5000${cert.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="secondary" size="sm" className="hidden sm:flex" >View PDF</Button>
                                                    </a>
                                                    <button onClick={() => handleDelete(cert.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
