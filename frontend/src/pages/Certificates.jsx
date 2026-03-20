import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Upload, FileText, Search, Trash2, Download, Eye } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import { getFileUrl } from '../utils/urlUtils';

export default function Certificates() {
    const { certificates, interns, addCertificate, deleteCertificate, downloadCertificate } = useData();
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedInternId, setSelectedInternId] = useState('');
    const [certNameInput, setCertNameInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);
    const { addToast } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCertId, setSelectedCertId] = useState(null);

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
        // The backend `uploadCertificate` will handle default visibility/download if assigned
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

    const handleDeleteClick = (id) => {
        setSelectedCertId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedCertId) {
            deleteCertificate(selectedCertId);
            addToast('Certificate deleted', 'error');
            setSelectedCertId(null);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] space-y-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Certificate Control</h2>
                    <p className="text-gray-500 text-sm mt-1">Upload and assign certificates to interns.</p>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left Side: Upload Section (Fixed on desktop) */}
                <div className="hidden lg:block w-80 flex-shrink-0 overflow-y-auto pb-4">
                    <Card className="h-fit">
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
                                <p className="text-sm font-medium text-gray-900">Click to upload</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="certNameInput">Certificate Name</label>
                                    <input
                                        id="certNameInput"
                                        type="text"
                                        value={certNameInput}
                                        onChange={(e) => setCertNameInput(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Optional name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Intern <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={selectedInternId}
                                        onChange={(e) => setSelectedInternId(e.target.value)}
                                    >
                                        <option value="">-- Select Intern --</option>
                                        {interns.filter(i => i.status === 'Active').map(intern => (
                                            <option key={intern.id} value={intern.id}>{intern.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button className="w-full" onClick={() => fileInputRef.current?.click()}>Upload Now</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: List Section (Independently scrollable) */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                            <CardTitle>All Certificates</CardTitle>
                            <div className="relative w-48 hidden sm:block">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr className="border-b border-gray-100">
                                            <th className="px-6 py-3 font-medium text-nowrap">File Name</th>
                                            <th className="px-6 py-3 font-medium text-nowrap">Uploaded</th>
                                            <th className="px-6 py-3 font-medium text-nowrap">Size</th>
                                            <th className="px-6 py-3 font-medium text-center text-nowrap">Status</th>
                                            <th className="px-6 py-3 font-medium text-center text-nowrap">View</th>
                                            <th className="px-6 py-3 font-medium text-right text-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {certificates.filter(cert => 
                                            cert.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            cert.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((cert) => (
                                            <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={20} className="text-red-500 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">{cert.name}</p>
                                                            <p className="text-[10px] text-brand-600 mt-0.5 truncate">To: {cert.assignedTo?.name || 'Unknown'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{cert.uploadedDate}</td>
                                                <td className="px-6 py-4 text-gray-600 text-xs whitespace-nowrap">
                                                    {cert.fileSize ? (
                                                        cert.fileSize > 1024 * 1024 
                                                            ? (cert.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
                                                            : (cert.fileSize / 1024).toFixed(1) + ' KB'
                                                    ) : 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium",
                                                        cert.assignedCount > 0 ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"
                                                    )}>
                                                        {cert.assignedCount > 0 ? 'Assigned' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => window.open(getFileUrl(cert.fileUrl || cert.resourcePath), '_blank')}
                                                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-block"
                                                        title="View Certificate"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => downloadCertificate(cert.id, cert.fileName)} 
                                                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(cert.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={14} />
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

            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this certificate? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
