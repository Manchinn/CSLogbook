// hooks/useWorkflowProgress.js
import { useState, useEffect, useCallback } from 'react';
import { getWorkflowProgress, getBlockedStudents } from 'features/reports/services/workflowReportService';

export const useWorkflowProgress = (initialFilters = {}) => {
  const [data, setData] = useState(null);
  const [blockedStudents, setBlockedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    workflowType: initialFilters.workflowType || 'internship',
    academicYear: initialFilters.academicYear || null,
    semester: initialFilters.semester || null
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, blockedRes] = await Promise.all([
        getWorkflowProgress(filters),
        getBlockedStudents(filters)
      ]);
      
      setData(progressRes.data);
      setBlockedStudents(blockedRes.data || []);
    } catch (err) {
      console.error('Error fetching workflow progress:', err);
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
    blockedStudents,
    loading,
    error,
    filters,
    updateFilters,
    refresh
  };
};
