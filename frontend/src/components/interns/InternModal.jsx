import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function InternModal({ isOpen, onClose, onSubmit, initialData }) {
    const isEdit = !!initialData;

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, collect form data
        onSubmit({
            id: initialData?.id || Date.now(),
            name: e.target.name.value,
            email: e.target.email.value,
            role: e.target.role.value,
            // ... other fields
        });
        onClose();
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Domain</label>
                    <select
                        name="role"
                        defaultValue={initialData?.role}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="Data Scientist">Data Scientist</option>
                    </select>
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
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{isEdit ? 'Save Changes' : 'Create Intern'}</Button>
                </div>
            </form>
        </Modal>
    );
}
