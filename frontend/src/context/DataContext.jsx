import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

import axios from 'axios';

// Initial Dummy Data for certificates only
const initialCertificates = [
    {
        id: 1,
        name: 'Web Development Internship.pdf',
        size: '2.4 MB',
        uploadedDate: '2026-01-20',
        visibility: 'Public',
        assignments: [
            { internId: 1, canDownload: true },
            { internId: 2, canDownload: false }
        ]
    },
    {
        id: 2,
        name: 'React Advanced Course.pdf',
        size: '1.8 MB',
        uploadedDate: '2026-01-25',
        visibility: 'Private',
        assignments: []
    },
];

export const DataProvider = ({ children }) => {
    const [interns, setInterns] = useState([]);

    const fetchInterns = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await axios.get('http://localhost:5000/api/admin/interns');
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
    };

    useEffect(() => {
        fetchInterns();
    }, []);

    const [certificates, setCertificates] = useState(() => {
        const saved = localStorage.getItem('certificates');
        return saved ? JSON.parse(saved) : initialCertificates;
    });

    // Persistence for certificates only
    useEffect(() => {
        localStorage.setItem('certificates', JSON.stringify(certificates));
    }, [certificates]);

    // --- Intern Actions ---
    const addIntern = async (intern) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/admin/intern', intern, {
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

    const updateIntern = async (id, updates) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:5000/api/admin/intern/${id}`, updates, {
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
            const res = await axios.delete(`http://localhost:5000/api/admin/intern/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchInterns(); // Refresh list
                // Also remove assignments for this intern
                setCertificates(certificates.map(c => ({
                    ...c,
                    assignments: c.assignments.filter(a => a.internId !== id)
                })));
            }
        } catch (error) {
            console.error("Error deleting intern:", error.response?.data || error);
            throw error;
        }
    };

    const blockIntern = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`http://localhost:5000/api/admin/intern/${id}/block`, {}, {
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
            const res = await axios.patch(`http://localhost:5000/api/admin/intern/${id}/activate`, {}, {
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

    // --- Certificate Actions ---
    const addCertificate = (cert) => {
        const newCert = { ...cert, id: Date.now(), assignments: [], visibility: 'Private' };
        setCertificates([newCert, ...certificates]);
    };

    const deleteCertificate = (id) => {
        setCertificates(certificates.filter(c => c.id !== id));
    };

    const updateCertificate = (id, updates) => {
        setCertificates(certificates.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const assignCertificate = (certId, internId) => {
        setCertificates(certificates.map(c => {
            if (c.id === certId) {
                // Check if already assigned
                if (c.assignments.some(a => a.internId === internId)) return c;
                return {
                    ...c,
                    assignments: [...c.assignments, { internId, canDownload: false }] // Default no download
                };
            }
            return c;
        }));
    };

    const toggleDownloadPermission = (certId, internId) => {
        setCertificates(certificates.map(c => {
            if (c.id === certId) {
                return {
                    ...c,
                    assignments: c.assignments.map(a =>
                        a.internId === internId ? { ...a, canDownload: !a.canDownload } : a
                    )
                };
            }
            return c;
        }));
    };

    const value = {
        interns,
        certificates,
        fetchInterns,
        addIntern,
        updateIntern,
        deleteIntern,
        blockIntern,
        activateIntern,
        addCertificate,
        deleteCertificate,
        updateCertificate,
        assignCertificate,
        toggleDownloadPermission
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
