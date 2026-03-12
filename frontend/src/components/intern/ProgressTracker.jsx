import React from 'react';

export const ProgressTracker = ({ totalTasks, completedTasks }) => {
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Task Progress</h3>
                <span className="text-sm font-semibold text-brand-600">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                <div
                    className="bg-brand-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-sm text-gray-500">
                You have completed <span className="font-semibold text-gray-900">{completedTasks}</span> out of <span className="font-semibold text-gray-900">{totalTasks}</span> tasks.
            </p>
        </div>
    );
};
