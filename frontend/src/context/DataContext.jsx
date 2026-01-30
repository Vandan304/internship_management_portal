import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// Initial Dummy Data
const initialInterns = Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    name: `Intern User ${i + 1}`,
    email: `intern${i + 1}@example.com`,
    password: 'password123', // Default password for testing
    role: 'Frontend Developer',
    status: i % 3 === 0 ? 'Inactive' : 'Active',
    joinDate: '2026-01-15',
    loginAllowed: true,
}));

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
    const [interns, setInterns] = useState(() => {
        const saved = localStorage.getItem('interns');
        return saved ? JSON.parse(saved) : initialInterns;
    });

    const [certificates, setCertificates] = useState(() => {
        const saved = localStorage.getItem('certificates');
        return saved ? JSON.parse(saved) : initialCertificates;
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem('interns', JSON.stringify(interns));
    }, [interns]);

    useEffect(() => {
        localStorage.setItem('certificates', JSON.stringify(certificates));
    }, [certificates]);

    // --- Intern Actions ---
    const addIntern = (intern) => {
        const newIntern = { ...intern, id: Date.now(), loginAllowed: true, status: 'Active', password: 'password123' };
        setInterns([newIntern, ...interns]);
    };

    const updateIntern = (id, updates) => {
        setInterns(interns.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const deleteIntern = (id) => {
        setInterns(interns.filter(i => i.id !== id));
        // Also remove assignments for this intern
        setCertificates(certificates.map(c => ({
            ...c,
            assignments: c.assignments.filter(a => a.internId !== id)
        })));
    };

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
        addIntern,
        updateIntern,
        deleteIntern,
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
