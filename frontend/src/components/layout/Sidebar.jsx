import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Download, Settings, LogOut, X, ListTodo, ClipboardCheck, TrendingUp, MessageCircle, Trophy } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/logo1_backup.png';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
    { icon: Users, label: 'Interns', to: '/admin/interns' },
    { icon: ListTodo, label: 'Task Management', to: '/admin/tasks' },
    { icon: ClipboardCheck, label: 'Task Review', to: '/admin/task-review' },
    { icon: TrendingUp, label: 'Intern Progress', to: '/admin/intern-progress' },
    { icon: Trophy, label: 'Leaderboard', to: '/admin/leaderboard' },
    { icon: FileText, label: 'Certificates', to: '/admin/certificates' },
    { icon: Download, label: 'Permissions', to: '/admin/permissions' },
    { icon: MessageCircle, label: 'Chat', to: '/admin/chat' },
];

export function Sidebar({ isOpen, onClose }) {
    const { logout } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-gray-900/50 z-40 transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            {/* Sidebar Container */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-soft transform transition-transform duration-300 lg:transform-none flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-50">
                    <div className="flex items-center gap-2 font-bold text-xl text-brand-700">
                        <img src={logoImage} alt="InternSys Logo" className="h-8 md:h-10 w-auto object-contain" />
                    </div>
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/admin'} // Exact match for root
                            onClick={onClose}
                            className={({ isActive }) => cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-200"
                                    : "text-gray-600 hover:bg-sky-50 hover:text-sky-700"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} className={`transition-colors ${isActive ? "text-sky-600" : "text-gray-400 group-hover:text-sky-500"}`} />
                                    {item.label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-50">
                    <button onClick={logout} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors">
                        <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}


