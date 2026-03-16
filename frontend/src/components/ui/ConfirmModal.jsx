import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger" // danger, warning, info
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-3 rounded-xl shrink-0",
                            type === 'danger' ? "bg-red-50 text-red-600" : 
                            type === 'warning' ? "bg-amber-50 text-amber-600" : 
                            "bg-blue-50 text-blue-600"
                        )}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95",
                            type === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-200" : 
                            type === 'warning' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" : 
                            "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
