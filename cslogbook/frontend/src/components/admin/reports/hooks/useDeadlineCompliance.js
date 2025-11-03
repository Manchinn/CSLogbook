// hooks/useDeadlineCompliance.js
import { useState, useEffect, useCallback } from 'react';
import { getDeadlineCompliance } from '../../../../services/reports/deadlineReportService';

export const useDeadlineCompliance = (initialFilters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    academicYear: initialFilters.academicYear || null,
    semester: initialFilters.semester || null,
    relatedTo: initialFilters.relatedTo || null
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDeadlineCompliance(filters);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching deadline compliance:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refresh
  };
};
