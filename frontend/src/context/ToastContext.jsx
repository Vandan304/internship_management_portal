/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

let globalAddToast = null;

export const toast = {
    success: (msg) => globalAddToast?.(msg, 'success'),
    error: (msg) => globalAddToast?.(msg, 'error'),
    info: (msg) => globalAddToast?.(msg, 'info'),
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    React.useEffect(() => {
        globalAddToast = addToast;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toastItem) => (
                    <div
                        key={toastItem.id}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] animate-fade-in-up transition-all pointer-events-auto",
                            toastItem.type === 'success' && "bg-white border-l-4 border-green-500 text-gray-800",
                            toastItem.type === 'error' && "bg-white border-l-4 border-red-500 text-gray-800",
                            toastItem.type === 'info' && "bg-white border-l-4 border-blue-500 text-gray-800"
                        )}
                    >
                        {toastItem.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                        {toastItem.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                        {toastItem.type === 'info' && <Info size={20} className="text-blue-500" />}

                        <p className="text-sm font-medium flex-1">{toastItem.message}</p>

                        <button
                            onClick={() => removeToast(toastItem.id)}
                            className="text-gray-400 hover:text-gray-600 pointer-events-auto"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
