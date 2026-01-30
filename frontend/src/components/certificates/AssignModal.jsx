import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function AssignModal({ isOpen, onClose, onAssign, certificateName }) {

    // Mock list of interns for the dropdown
    const interns = [
        { id: 1, name: "User 1" },
        { id: 2, name: "User 2" },
        { id: 3, name: "User 3" },
        { id: 4, name: "User 4" },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        const internId = e.target.intern.value;
        const internName = interns.find(i => i.id == internId)?.name;
        onAssign(internName);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Certificate">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <p className="text-sm text-gray-600 mb-3">
                        Assigning <span className="font-semibold text-gray-900">{certificateName}</span>
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Intern</label>
                    <select
                        name="intern"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        required
                    >
                        <option value="">Choose an intern...</option>
                        {interns.map(intern => (
                            <option key={intern.id} value={intern.id}>{intern.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Assign</Button>
                </div>
            </form>
        </Modal>
    );
}
