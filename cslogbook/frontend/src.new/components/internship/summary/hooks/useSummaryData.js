import { useState, useEffect, useCallback } from 'react';
import internshipService from '../../../../../services/internshipService'; // Updated path
import { message } from 'antd';

const useSummaryData = (internshipId) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSummary = useCallback(async () => {
        if (!internshipId) {
            setSummary(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await internshipService.getInternshipSummary(internshipId);
            setSummary(response.data);
        } catch (err) {
            setError(err);
            message.error('Failed to load summary data.');
            console.error("Error fetching summary data:", err);
        } finally {
            setLoading(false);
        }
    }, [internshipId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return { summary, loading, error, refreshSummary: fetchSummary };
};

export default useSummaryData;