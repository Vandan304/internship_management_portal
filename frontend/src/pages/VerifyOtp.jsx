import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            toast.error("Invalid session. Redirecting to login.");
            navigate('/login');
        }
    }, [email, navigate]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== "") {
            element.nextSibling.focus();
        }
    };

    const handleVerifyParams = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpCode.length !== 4) {
            toast.error("Please enter a valid 4-digit OTP code");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp: otpCode });

            if (res.data.success) {
                toast.success("OTP verified successfully");
                navigate('/reset-password', { state: { email } });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP code");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            toast.success("A new OTP has been sent to your email");
            setOtp(['', '', '', '']);
        } catch (err) {
            toast.error("Failed to resend OTP");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-brand-600 rounded-full mb-4 shadow-lg shadow-brand-500/30">
                        <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
                    <p className="text-gray-600 mt-2">Enter the verification code sent to <br /><span className="font-semibold text-gray-900">{email}</span></p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-8">
                    <form onSubmit={handleVerifyParams} className="space-y-6">
                        <div className="flex justify-center gap-3">
                            {otp.map((data, index) => {
                                return (
                                    <input
                                        className="w-14 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-400 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                                        type="text"
                                        name="otp"
                                        maxLength="1"
                                        key={index}
                                        value={data}
                                        onChange={e => handleChange(e.target, index)}
                                        onFocus={e => e.target.select()}
                                    />
                                );
                            })}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all duration-200 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Didn't receive code?{' '}
                            <button onClick={handleResend} className="font-medium text-brand-600 hover:text-brand-700 cursor-pointer border-none bg-transparent">
                                Resend now
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
