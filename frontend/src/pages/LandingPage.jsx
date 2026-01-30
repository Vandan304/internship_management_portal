import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Users, BarChart3, GraduationCap } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-brand-500 selection:text-white">
            {/* Navbar */}
            <nav className="fixed w-full z-50 glass border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-brand-600 rounded-lg shadow-lg shadow-brand-500/30">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
                                InternFlow
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
                                Sign In
                            </Link>
                            <Link to="/register" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 text-sm font-medium">
                                Get Started
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
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-medium shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:scale-105 transition-all duration-200">
                                Start Free Trial
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                                View Demo
                            </Link>
                        </div>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="mt-16 relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200/60 overflow-hidden">
                            <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="aspect-[16/9] bg-gray-50 flex items-center justify-center text-gray-400">
                                {/* Placeholder for dashboard image or mock UI */}
                                <div className="text-center p-8">
                                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-brand-200" />
                                    <span className="text-sm uppercase tracking-wide font-semibold text-gray-400">Interactive Dashboard Preview</span>
                                </div>
                            </div>
                        </div>
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

            {/* CTA Section */}
            <div className="py-20 bg-brand-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-800 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-600 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to streamline your workflow?</h2>
                    <p className="text-brand-200 mb-10 text-lg">Join thousands of organizations that trust InternFlow for their management needs.</p>
                    <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-brand-900 rounded-xl font-bold hover:bg-brand-50 transition-colors">
                        Get Started Now
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-brand-500" />
                        <span className="text-white font-bold text-lg">InternFlow</span>
                    </div>
                    <div className="text-sm">
                        &copy; {new Date().getFullYear()} InternFlow. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
