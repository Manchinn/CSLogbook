import { useState, useEffect } from 'react';
import internshipService from '../services/internshipService';

export const useInternshipStatus = () => {
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await internshipService.getRegistrationFlow();
      setStatus(response);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, loading, refetch: fetchStatus };
};