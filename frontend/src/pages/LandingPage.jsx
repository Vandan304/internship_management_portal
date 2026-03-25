import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, BarChart3, Users } from 'lucide-react';
import logoImage from '../assets/logo1_backup.png';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-brand-500 selection:text-white">
            {/* Navbar */}
            <nav className="fixed w-full z-50 glass border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <img src={logoImage} alt="InternSys Logo" className="h-8 md:h-10 w-auto object-contain" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
            {/* Hero Section */}
            <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-sm font-medium mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                            </span>
                            Streamlining Internship Management
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                            Manage Internships <span className="text-brand-600">Like a Pro</span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                            The all-in-one platform for managing intern data, tracking progress, issuing certificates, and permissions. Built for modern organizations.
                        </p>
                    </div>

                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Powerful features to help you manage your internship program efficiently and effectively.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Users className="w-6 h-6 text-brand-600" />,
                                title: "Intern Management",
                                description: "Easily onboard, track, and manage intern profiles and their progress throughout the program."
                            },
                            {
                                icon: <Shield className="w-6 h-6 text-brand-600" />,
                                title: "Secure Data",
                                description: "Enterprise-grade security for all your sensitive data. Role-based access control included."
                            },
                            {
                                icon: <CheckCircle className="w-6 h-6 text-brand-600" />,
                                title: "Easy Certification",
                                description: "Automated certificate generation and distribution system."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src={logoImage} alt="InternSys Logo" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="text-sm">
                        &copy; {new Date().getFullYear()} Appifly Infotech . All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
