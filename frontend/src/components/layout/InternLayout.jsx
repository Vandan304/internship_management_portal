import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { InternSidebar } from './InternSidebar';
import { Header } from './Header'; // Reusing Header for now, created specialized if needed later

export function InternLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
            <InternSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto h-full space-y-6 flex flex-col">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
