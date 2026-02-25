import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, role }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    // Show a loading spinner while AuthContext verifies the token on mount
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
        );
    }

    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

    // 1. Check if authenticated but trying to access guest page
    if (isAuthenticated && user && isAuthRoute) {
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        } else if (user.role === 'intern') {
            return <Navigate to="/intern" replace />;
        }
    }

    // 2. Check if NOT authenticated
    if (!isAuthenticated || !user) {
        if (!isAuthRoute) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
        return children;
    }

    // 3. Check Role-based access
    if (role && user.role !== role) {
        // User is logged in but trying to access a route they don't have permission for
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        } else if (user.role === 'intern') {
            return <Navigate to="/intern" replace />;
        }

        // Fallback for unknown roles
        return <Navigate to="/login" replace />;
    }

    // 3. Authorized
    return children;
};

export default ProtectedRoute;
