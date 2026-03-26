/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// State managed via backend

// State managed via backend

export const DataProvider = ({ children }) => {
    const { user, isAuthenticated, socket } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [interns, setInterns] = useState([]);

    const fetchInterns = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await axios.get(`/api/admin/interns`);
                if (res.data.success) {
                    setInterns(res.data.data.map(i => ({
                        ...i,
                        id: i._id,
                        status: i.isActive ? 'Active' : 'Inactive',
                        joinDate: i.createdAt ? i.createdAt.split('T')[0] : 'N/A'
                    })));
                }
            }
        } catch (error) {
            console.error("Error fetching interns:", error);
        }
    }, []);

    const [certificates, setCertificates] = useState([]);
    const fetchCertificatesAdmin = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await axios.get(`/api/certificates`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setCertificates(res.data.data.map(c => ({
                        ...c,
                        id: c._id, // map Mongo _id to id for frontend compatibility
                        name: c.title,
                        fileName: c.fileName,
                        fileSize: c.fileSize,
                        fileType: c.fileType,
                        assignedCount: c.assignedCount,
                        uploadedDate: c.createdAt ? c.createdAt.split('T')[0] : 'N/A'
                    })));
                }
            }
        } catch (error) {
            console.error("Error fetching certificates:", error);
        }
    }, []);

    const fetchMyCertificates = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await axios.get(`/api/certificates/my-certificates`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setCertificates(res.data.data.map(c => ({
                        ...c,
                        id: c._id || c.id,
                        name: c.title,
                        fileName: c.fileName,
                        uploadedDate: c.createdAt ? c.createdAt.split('T')[0] : 'N/A'
                    })));
                }
            }
        } catch (error) {
            console.error("Error fetching my certificates:", error);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setIsLoading(true);
            if (user.role === 'admin') {
                await Promise.all([fetchInterns(), fetchCertificatesAdmin()]);
            } else if (user.role === 'intern') {
                await fetchMyCertificates();
            }
            if (isMounted) setIsLoading(false);
        };

        if (isAuthenticated && user && isMounted) {
            loadInitialData();
        } else if (!isAuthenticated && isMounted) {
            setIsLoading(false);
        }
        return () => { isMounted = false; };
    }, [isAuthenticated, user, fetchInterns, fetchCertificatesAdmin, fetchMyCertificates]);

    // --- Socket & Polling Fallback ---
    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'intern') return;

        // 1. Real-time Socket Updates
        if (socket) {
            socket.on('refreshCertificates', fetchMyCertificates);
        }

        // 2. Fallback Polling (Every 5 seconds)
        const interval = setInterval(() => {
            fetchMyCertificates();
        }, 5000);

        return () => {
            if (socket) socket.off('refreshCertificates', fetchMyCertificates);
            clearInterval(interval);
        };
    }, [socket, user, isAuthenticated, fetchMyCertificates]);

    // --- Intern Actions ---
    const addIntern = async (intern) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/admin/intern`, intern, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchInterns(); // Refresh list
            }
        } catch (error) {
            console.error("Error adding intern:", error.response?.data || error);
            throw error;
        }
    };

    const approveTask = async (id, comment) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`/api/tasks/${id}/approve`, 
                { comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (res.data.success) {
                // Refresh both tasks and leaderboard to reflect new points/rank
                await Promise.all([
                    fetchTasksAdmin(),
                    fetchLeaderboard()
                ]);
                return res.data;
            }
        } catch (error) {
            console.error('Error approving task:', error);
            throw error;
        }
    };

    const updateIntern = async (id, updates) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`/api/admin/intern/${id}`, updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchInterns(); // Refresh list
            }
        } catch (error) {
            console.error("Error updating intern:", error.response?.data || error);
            throw error;
        }
    };

    const deleteIntern = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`/api/admin/intern/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Safely manually sync frontend arrays rather than immediately fetching the whole list back
                setInterns(prev => Array.isArray(prev) ? prev.filter(i => i._id !== id && i.id !== id) : []);

                // Safely remove assignments for this intern
                setCertificates(prev => Array.isArray(prev) ? prev.map(c => ({
                    ...c,
                    assignments: Array.isArray(c.assignments) ? c.assignments.filter(a => a.internId !== id) : []
                })) : []);
            }
        } catch (error) {
            console.error("Failed to delete intern:", error.response?.data || error);
            throw error;
        }
    };

    const blockIntern = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`/api/admin/intern/${id}/block`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchInterns(); // Refresh list
            }
        } catch (error) {
            console.error("Error blocking intern:", error.response?.data || error);
            throw error;
        }
    }

    const activateIntern = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`/api/admin/intern/${id}/activate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchInterns(); // Refresh list
            }
        } catch (error) {
            console.error("Error activating intern:", error.response?.data || error);
            throw error;
        }
    }

    const generateCompletionCertificate = async (internId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/certificates/generate-completion`, { internId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchInterns();
                fetchCertificatesAdmin();
            }
            return res.data;
        } catch (error) {
            console.error("Error generating completion certificate:", error.response?.data || error);
            throw error;
        }
    };
    const generateOfferLetter = async (internId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/certificates/generate-offer-letter`, { internId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchInterns();
                fetchCertificatesAdmin();
            }
            return res.data;
        } catch (error) {
            console.error("Error generating offer letter:", error.response?.data || error);
            throw error;
        }
    };

    // --- Certificate Actions ---
    const addCertificate = async (formData) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/certificates/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.success) {
                fetchCertificatesAdmin(); // Refresh list
            }
            return res.data;
        } catch (error) {
            console.error("Error uploading certificate:", error.response?.data || error);
            throw error;
        }
    };

    const deleteCertificate = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`/api/certificates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchCertificatesAdmin(); // Refresh list
            }
        } catch (error) {
            console.error("Error deleting certificate:", error.response?.data || error);
            throw error;
        }
    };

    const updateCertificate = async (id, updates) => {
        try {
            const token = localStorage.getItem('token');
            const apiUpdates = {};
            if (updates.name) apiUpdates.title = updates.name;
            if (updates.visibility) apiUpdates.isVisible = updates.visibility === 'Public';

            const res = await axios.put(`/api/certificates/${id}`, apiUpdates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchCertificatesAdmin();
            }
        } catch (error) {
            console.error("Error updating certificate:", error.response?.data || error);
            throw error;
        }
    };

    const toggleCertificateVisibility = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`/api/certificates/${id}/visibility`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchCertificatesAdmin();
            }
        } catch (error) {
            console.error("Error toggling certificate visibility:", error.response?.data || error);
            throw error;
        }
    }

    const toggleDownloadPermission = async (certId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`/api/certificates/${certId}/download`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchCertificatesAdmin();
            }
        } catch (error) {
            console.error("Error toggling download permission:", error.response?.data || error);
            throw error;
        }
    };

    // --- Intern Certificate Endpoints ---
    const downloadCertificate = async (id, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/files/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' // Tell Axios to expect binary data
            });

            // Create a blob URL and trigger download mathematically
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'certificate.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading certificate:", error);
            throw error;
        }
    };

    const [leaderboardData, setLeaderboardData] = useState({ top3: [], fullList: [] });

    const fetchLeaderboard = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await axios.get(`/api/leaderboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setLeaderboardData({
                        top3: res.data.top3,
                        fullList: res.data.fullList
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLeaderboard();
        }
    }, [isAuthenticated, fetchLeaderboard]);

    return (
        <DataContext.Provider value={{
            stats: {
                totalInterns: interns.length,
                activeInterns: interns.filter(i => i.status === 'Active').length,
                completedInternships: interns.filter(i => i.status === 'Completed').length,
                totalCertificates: certificates.length
            },
            interns,
            certificates,
            leaderboardData,
            fetchLeaderboard,
            fetchInterns,
            addIntern,
            updateIntern,
            deleteIntern,
            blockIntern,
            activateIntern,
            generateCompletionCertificate,
            generateOfferLetter,
            addCertificate,
            deleteCertificate,
            updateCertificate,
            toggleCertificateVisibility,
            toggleDownloadPermission,
            fetchCertificatesAdmin,
            fetchMyCertificates,
            downloadCertificate,
            isLoading
        }}>
            {children}
        </DataContext.Provider>
    );
};
