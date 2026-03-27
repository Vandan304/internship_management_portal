import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingButton = ({ 
    isLoading, 
    loadingText, 
    children, 
    className = "", 
    disabled = false, 
    type = "button",
    variant = "primary", // primary, danger, secondary, outline
    onClick,
    ...props 
}) => {
    const baseStyles = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-brand-600 text-white hover:bg-brand-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white"
    };

    return (
        <button
            type={type}
            disabled={isLoading || disabled}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
            <span>{isLoading ? (loadingText || children) : children}</span>
        </button>
    );
};

export default LoadingButton;
