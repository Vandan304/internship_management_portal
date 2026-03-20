import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = "Loading data, please wait..." }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8">
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-full shadow-lg border border-brand-50">
                    <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                </div>
            </div>
            <p className="mt-6 text-gray-500 font-medium text-lg animate-pulse">{message}</p>
        </div>
    );
}

export default LoadingSpinner;
