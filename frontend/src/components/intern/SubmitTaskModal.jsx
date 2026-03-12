import React, { useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const SubmitTaskModal = ({ isOpen, onClose, task, onTaskSubmitted }) => {
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !task) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check if it's a ZIP file
            if (!selectedFile.name.endsWith('.zip') && selectedFile.type !== 'application/zip' && selectedFile.type !== 'application/x-zip-compressed') {
                toast.error('Please upload a valid ZIP file.');
                setFile(null);
                e.target.value = ''; // clear input
                return;
            }
            if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
                toast.error('File size must be less than 50MB.');
                setFile(null);
                e.target.value = '';
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a ZIP file to upload.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('zipFile', file);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/tasks/${task._id}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success('Task submitted successfully!');
            onTaskSubmitted();
            onClose();
            setFile(null);
        } catch (error) {
            console.error('Error submitting task:', error);
            toast.error(error.response?.data?.message || 'Failed to submit task.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Submit Task</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                        <p className="text-sm text-gray-500">Week {task.weekNumber}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload ZIP File
                            </label>
                            <input
                                type="file"
                                accept=".zip,application/zip,application/x-zip-compressed"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-all border border-gray-200 rounded-lg"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">Only .zip files are allowed (Max 50MB).</p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!file || isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Submit Task
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
