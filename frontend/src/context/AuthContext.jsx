import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { interns } = useData(); // Access the real intern data

    useEffect(() => {
        // Auto-Simulate Login based on URL for "Open Access" request
        const path = window.location.pathname;

        if (path.includes('/admin')) {
            const adminUser = {
                id: 'admin_1',
                name: 'Admin User',
                email: 'admin@demo.com',
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
            };
            setUser(adminUser);
        } else if (path.includes('/intern')) {
            // Find first intern from DataContext or dummy
            const firstIntern = interns[0] || {
                id: 1,
                name: 'Intern User 1',
                email: 'intern1@example.com',
                role: 'intern',
                status: 'Active'
            };

            const internUser = {
                ...firstIntern,
                role: 'intern',
                avatar: `https://ui-avatars.com/api/?name=${firstIntern.name}&background=0D8ABC&color=fff`
            };
            setUser(internUser);
        } else {
            // Fallback to local storage or null
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setIsLoading(false);
    }, [interns]); // Add interns to dependancy so we pick up data if loaded later

    const login = async (email, password, role) => {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (role === 'admin') {
                    // Simple admin check
                    if (email.includes('admin')) { // Weak check for demo
                        const adminUser = {
                            id: 'admin_1',
                            name: 'Admin User',
                            email,
                            role: 'admin',
                            avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
                        };
                        setUser(adminUser);
                        localStorage.setItem('user', JSON.stringify(adminUser));
                        resolve(adminUser);
                    } else {
                        reject(new Error('Invalid admin credentials'));
                    }
                } else {
                    // Check against Interns in DataContext
                    const foundIntern = interns.find(i => i.email === email && i.loginAllowed);

                    if (foundIntern) {
                        // In a real app check password here too: && foundIntern.password === password
                        const internUser = {
                            ...foundIntern,
                            role: 'intern', // Ensure role is set to intern
                            avatar: `https://ui-avatars.com/api/?name=${foundIntern.name}&background=0D8ABC&color=fff`
                        };
                        setUser(internUser);
                        localStorage.setItem('user', JSON.stringify(internUser));
                        resolve(internUser);
                    } else {
                        reject(new Error('Invalid credentials or account blocked'));
                    }
                }
            }, 800);
        });
    };

    const register = async (name, email, password, role) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const userData = {
                    id: Date.now().toString(), // Use timestamp for ID
                    name,
                    email,
                    role,
                    avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
                };
                // In a real app, this should probably create the user in the backend (DataContext)
                // For now, we are just returning success. 
                // CRITICAL NOTE: Registration in this demo DOES NOT automatically add to DataContext interns list
                // because we usually want admins to control intern creation. 
                // But if we want self-registration:
                // This 'register' function is mainly used by simple auth flows.
                // Given the requirement "Admin can create intern", maybe public registration is not the primary way, 
                // but let's leave it as is for now. Self-registered users won't be in the Admin's "interns" list 
                // unless we add them there. 

                resolve(userData);
            }, 1000);
        });
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const value = {
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isIntern: user?.role === 'intern'
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
