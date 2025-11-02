import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export const useInternshipStatus = () => {
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
  const response = await apiClient.get('/internship-registration/flow');
      setStatus(response.data);
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