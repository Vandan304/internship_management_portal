import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2 } from 'lucide-react';

export function InternModal({ isOpen, onClose, onSubmit, initialData, isLoading }) {
    const isEdit = !!initialData;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const data = {
            name: e.target.name.value.trim(),
            email: e.target.email.value.trim().toLowerCase(),
            mobileNumber: e.target.mobileNumber?.value.trim() || null,
            internRole: e.target.internRole.value.trim(),
            startDate: e.target.startDate.value,
            endDate: e.target.endDate.value,
        };

        if (isEdit) {
            data.id = initialData.id;
        }

        onSubmit(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Intern' : 'Add New Intern'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        name="name"
                        defaultValue={initialData?.name}
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="e.g. Rahul Sharma"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            name="email"
                            defaultValue={initialData?.email}
                            type="email"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="e.g. rahul@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        <input
                            name="mobileNumber"
                            defaultValue={initialData?.mobileNumber}
                            type="text"
                            required
                            pattern="[0-9]{10}"
                            title="Please enter a 10-digit mobile number"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="e.g. 9876543210"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Domain</label>
                    <select
                        name="internRole"
                        defaultValue={initialData?.internRole || initialData?.role}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                        <option value="fullstack">Full Stack Developer</option>
                        <option value="frontend">Frontend Developer</option>
                        <option value="backend">Backend Developer</option>
                        <option value="ai">AI Engineer</option>
                        <option value="ml">ML Engineer</option>
                        <option value="datascience">Data Science</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            name="startDate"
                            defaultValue={initialData?.startDate?.split('T')[0]}
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            min={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            name="endDate"
                            defaultValue={initialData?.endDate?.split('T')[0]}
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            min={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                        />
                    </div>
                </div>

                {!isEdit && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Intern ID</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Auto-generated"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Password</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Auto-generated"
                                disabled
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {isLoading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Intern')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
