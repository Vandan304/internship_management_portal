/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Set base URL for all axios requests
axios.defaults.baseURL = `${import.meta.env.VITE_API_URL}`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Attach token to global axios headers
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Verify the token by calling the protected /me route
                    const res = await axios.get('/api/auth/me');
                    if (res.data.success) {
                        setUser(res.data.user);
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error("Token verification failed:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        verifyToken();
    }, []); // Removed logout from here to prevent infinite triggering, as it has no dependencies anyway.

    useEffect(() => {
        let newSocket;
        if (user) {
            newSocket = io(`${import.meta.env.VITE_API_URL}`);
            setSocket(newSocket);
            newSocket.emit('join', user._id || user.id);
        }

        return () => {
            if (newSocket) newSocket.close();
        };
    }, [user]);

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', {
                email,
                password
            });

            if (res.data.success) {
                const { token, user } = res.data;
                setUser(user);
                localStorage.setItem('token', token);
                // Set global header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return user; // Return user for redirectTo logic if needed in component
            }
            return null;

        } catch (error) {
            console.error("Login Error in AuthContext:", error.response?.data || error);

            // Extract the specific error message from the backend
            const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';

            // Throw a new error with the extracted message so the frontend component can catch and display it
            throw new Error(errorMessage);
        }
    };

    const register = async (name, email, password, role) => {
        try {
            const res = await axios.post('/api/auth/register', {
                name,
                email,
                password,
                role
            });

            if (res.data.success) {
                return res.data.user;
            }
            return null;
        } catch (error) {
            console.error("Registration Error in AuthContext:", error.response?.data || error);
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            throw new Error(errorMessage);
        }
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
    };

    const updateFcmToken = async (fcmToken) => {
        try {
            await axios.post('/api/auth/update-fcm-token', { fcmToken });
            console.log('[FCM] Token updated on server');
        } catch (error) {
            console.error('[FCM ERROR] Failed to update token on server', error);
        }
    };

    const value = {
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        updateFcmToken,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isIntern: user?.role === 'intern',
        socket
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
