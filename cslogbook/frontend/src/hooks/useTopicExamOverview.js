// frontend/src/hooks/useTopicExamOverview.js
// Hook สำหรับดึงและจัดการ state ของ Topic Exam Overview
import { useState, useEffect, useCallback } from 'react';
import { fetchTopicExamOverview } from '../services/topicExamService';

const DEFAULT_FILTERS = {
  status: 'all',
  search: '',
  advisorId: '',
  readyOnly: false,
  sortBy: 'updatedAt',
  order: 'desc'
};

export function useTopicExamOverview(initialFilters = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ count: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
  const payload = await fetchTopicExamOverview(filters);
  setRecords(payload?.data || []);
  setMeta({ count: payload?.count || (payload?.data?.length || 0) });
    } catch (e) {
      setError(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilters = (patch) => {
    setFilters(f => ({ ...f, ...patch }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return { filters, updateFilters, resetFilters, loading, error, records, meta, reload: load };
}
