import React from 'react';

export function LoadingSpinner({ message = "Loading data, please wait..." }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8">
            <div className="relative flex items-center justify-center">
                <div className="relative p-2 rounded-full">
                    {/* To change the spinner size manually, adjust the "w-16 h-16" classes below. */}
                    {/* e.g., for smaller: w-10 h-10, for larger: w-20 h-20 */}
                    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" className="w-16 h-16 text-brand-600">
                        <g transform="translate(50,50)">
                            {[...Array(12)].map((_, i) => (
                                <g key={i} transform={`rotate(${i * 30})`}>
                                    <rect x="-4" y="-40" width="8" height="22" rx="4" ry="4" fill="currentColor" opacity="0.1">
                                        <animate attributeName="opacity" values="1;0.1" keyTimes="0;1" dur="1s" begin={`${(i / 12) - 1}s`} repeatCount="indefinite" />
                                    </rect>
                                </g>
                            ))}
                        </g>
                    </svg>
                </div>
            </div>
            <p className="mt-8 text-gray-500 font-medium text-lg animate-pulse">{message}</p>
        </div>
    );
}

export default LoadingSpinner;
