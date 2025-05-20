import React, { createContext, useState, useEffect, useContext } from 'react';
import internshipService from '../../../services/internshipService'; // Updated path
import { AuthContext } from '../auth/AuthContext'; // Updated path

const InternshipContext = createContext();

export const InternshipProvider = ({ children }) => {
    const [internshipData, setInternshipData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user && user.student_id) {
            const fetchInternshipData = async () => {
                try {
                    setLoading(true);
                    const response = await internshipService.getStudentInternshipInfo(user.student_id);
                    setInternshipData(response.data);
                    setError(null);
                } catch (err) {
                    setError(err.message || 'Failed to fetch internship data');
                    setInternshipData(null);
                } finally {
                    setLoading(false);
                }
            };
            fetchInternshipData();
        } else {
            // if no user or student_id, clear data and stop loading
            setInternshipData(null);
            setLoading(false);
        }
    }, [user]);

    const refreshInternshipData = async () => {
        if (user && user.student_id) {
            try {
                setLoading(true);
                const response = await internshipService.getStudentInternshipInfo(user.student_id);
                setInternshipData(response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Failed to refresh internship data');
            } finally {
                setLoading(false);
            }
        }
    };


    return (
        <InternshipContext.Provider value={{ internshipData, loading, error, refreshInternshipData }}>
            {children}
        </InternshipContext.Provider>
    );
};

export const useInternship = () => {
    const context = useContext(InternshipContext);
    if (context === undefined) {
        throw new Error('useInternship must be used within an InternshipProvider');
    }
    return context;
};

export default InternshipContext;
