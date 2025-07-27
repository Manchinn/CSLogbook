import { useState, useEffect } from 'react';
import * as importantDeadlineService from '../../services/admin/importantDeadlineService';

// hook สำหรับดึงและจัดการกำหนดการสำคัญ
export default function useImportantDeadlines({ academicYear, semester }) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const res = await importantDeadlineService.getDeadlines({ academicYear, semester });
      setDeadlines(res.data.data);
    } catch (e) {
      setDeadlines([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeadlines();
  }, [academicYear, semester]);

  return { deadlines, loading, fetchDeadlines };
} 