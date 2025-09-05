import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';
import { studentService } from '../services/studentService';

dayjs.extend(buddhistEra);

dayjs.locale('th');

// Hook สำหรับดึง deadline ที่จะถึง และอัพเดท countdown ทุก 60 วินาที
export default function useUpcomingDeadlines({ days = 7, refreshMinutes = 5 }) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const refreshTimer = useRef(null);
  const tickTimer = useRef(null);

  const enrich = (list) => list.map(d => {
    // backend ส่ง deadlineDate (YYYY-MM-DD) + deadlineTime (HH:mm:ss) ในเวลาท้องถิ่น Asia/Bangkok แล้ว
    const base = dayjs(`${d.deadlineDate} ${d.deadlineTime}`, 'YYYY-MM-DD HH:mm:ss');
    const now = dayjs();
    const diffMs = base.diff(now);
    const diffHours = Math.floor(diffMs / (1000*60*60));
    const diffDays = Math.floor(diffHours / 24);
    return {
      ...d,
      // ใช้ token BBBB (Buddhist Era) โดยไม่ต้อง .add(543,'year') ซ้ำ ไม่งั้นจะเป็น 3111
      formatted: base.format('D MMM BBBB เวลา HH:mm น.'),
      diffMs,
      diffHours,
      diffDays
    };
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
