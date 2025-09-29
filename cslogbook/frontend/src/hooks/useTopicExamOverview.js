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
  order: 'desc',
  academicYear: null,
  semester: null
};

export function useTopicExamOverview(initialFilters = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({
    count: 0,
    availableAcademicYears: [],
    availableSemestersByYear: {},
    defaultAcademicYear: null,
    defaultSemester: null,
    appliedFilters: {}
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
  const payload = await fetchTopicExamOverview(filters);
  setRecords(payload?.data || []);
  setMeta({
    count: payload?.count || (payload?.data?.length || 0),
    availableAcademicYears: payload?.meta?.availableAcademicYears || [],
    availableSemestersByYear: payload?.meta?.availableSemestersByYear || {},
    defaultAcademicYear: payload?.meta?.defaultAcademicYear ?? null,
    defaultSemester: payload?.meta?.defaultSemester ?? null,
    appliedFilters: payload?.meta?.appliedFilters || {}
  });
    } catch (e) {
      setError(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (filters.academicYear == null && meta.defaultAcademicYear != null) {
      setFilters((prev) => ({ ...prev, academicYear: meta.defaultAcademicYear }));
    }
  }, [filters.academicYear, meta.defaultAcademicYear]);

  useEffect(() => {
    if (filters.academicYear == null) {
      if (filters.semester != null) {
        setFilters((prev) => ({ ...prev, semester: null }));
      }
      return;
    }

    const available = meta.availableSemestersByYear?.[filters.academicYear] || [];

    if (!available.length) {
      if (filters.semester != null) {
        setFilters((prev) => ({ ...prev, semester: null }));
      }
      return;
    }

    if (filters.semester != null && !available.includes(filters.semester)) {
      setFilters((prev) => ({ ...prev, semester: available[0] ?? null }));
      return;
    }

    if (filters.semester == null && meta.defaultSemester != null && available.includes(meta.defaultSemester)) {
      setFilters((prev) => ({ ...prev, semester: meta.defaultSemester }));
    }
  }, [filters.academicYear, filters.semester, meta.availableSemestersByYear, meta.defaultSemester]);

  const updateFilters = (patch) => {
    setFilters(f => ({ ...f, ...patch }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return { filters, updateFilters, resetFilters, loading, error, records, meta, reload: load };
}
