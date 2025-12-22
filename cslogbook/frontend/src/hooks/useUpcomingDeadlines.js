import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';
import { studentService } from 'features/user-management/services/studentService';
import { normalizeDeadline } from '../utils/deadlineNormalize';

dayjs.extend(buddhistEra);

dayjs.locale('th');

// Hook สำหรับดึง deadline ที่จะถึง และอัพเดท countdown ทุก 60 วินาที
export default function useUpcomingDeadlines({ days = 7, refreshMinutes = 5 }) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const refreshTimer = useRef(null);
  const tickTimer = useRef(null);

  const enrich = (list) => list.map(raw => {
    const d = normalizeDeadline(raw);
    const base = d.deadline_at_local || d.effective_deadline_local; // ใช้ canonical
    if (!base) {
      return { ...d, formatted: '-', diffMs: 0, diffHours: 0, diffDays: 0 };
    }
    const now = dayjs();
    const diffMs = base.diff(now);
    const diffHours = Math.floor(diffMs / (1000*60*60));
    const diffDays = Math.floor(diffHours / 24);
    return { ...d, formatted: base.format('D MMM BBBB เวลา HH:mm น.'), diffMs, diffHours, diffDays };
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await studentService.getUpcomingDeadlines(days);
        setDeadlines(enrich(data));
      } catch(e) {
        setDeadlines([]);
      }
      setLoading(false);
    };
    fetchData();
    refreshTimer.current = setInterval(fetchData, refreshMinutes*60*1000);
    tickTimer.current = setInterval(() => setDeadlines(prev => enrich(prev)), 60*1000);
    return () => {
      clearInterval(refreshTimer.current); clearInterval(tickTimer.current);
    };
  }, [days, refreshMinutes]);

  return { deadlines, loading };
}
