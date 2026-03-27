import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logoImage from '../assets/logo_trimmed.png';
import axios from 'axios';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter your email address first");
            return;
        }

        try {
            setIsSendingOtp(true);
            const res = await axios.post(`/api/auth/forgot-password`, { email });

            if (res.data.success) {
                toast.success("OTP has been sent to your email");
                navigate('/verify-otp', { state: { email } });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(''); // Clear any previous errors
        try {
            const user = await login(email, password);

            if (user?.role === 'admin') {
                navigate('/admin');
            } else if (user?.role === 'intern') {
                navigate('/intern');
            }
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10 -mt-10">
                <div className="text-center mb-4">
                    <Link to="/" className="inline-flex items-center justify-center mb-1 hover:opacity-80 transition-opacity w-full">
                        <img src={logoImage} alt="InternSys Logo" className="h-28 md:h-34 w-auto mx-auto object-contain" />
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                    <p className="text-gray-600 mt-1">Sign in to your account to continue</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-8">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                                <button 
                                    type="button" 
                                    onClick={handleForgotPassword} 
                                    className="text-sm font-medium text-brand-600 hover:text-brand-700 bg-transparent border-none cursor-pointer disabled:opacity-50"
                                    disabled={isSendingOtp}
                                >
                                    {isSendingOtp ? 'Sending OTP...' : 'Forgot password?'}
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent border-none cursor-pointer p-1"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span> <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;