import { useEffect, useState, useCallback } from 'react';
import dayjs from '../utils/dayjs';
import { studentService } from '../services/studentService';

// hook ดึง deadline ทั้งหมด (สำหรับ Calendar / Progress)
export default function useAllDeadlines({ academicYear, refreshIntervalMs = 5 * 60 * 1000 } = {}) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
  // ถ้า frontend เป็น พ.ศ. (>2500) ให้ส่งปี ค.ศ. ไป backend (ลด 543) เพื่อความแน่นอน
  const sendYear = academicYear && academicYear > 2500 ? academicYear - 543 : academicYear;
  const res = await studentService.getAllDeadlines(sendYear);
      const raw = Array.isArray(res) ? res : (res?.data || []);
      if (process.env.NODE_ENV === 'development') {
        // debug ช่วยตรวจว่าข้อมูลมาหรือไม่
        // eslint-disable-next-line no-console
        console.log('[useAllDeadlines] fetched', raw.length, 'items for year', academicYear, 'sendYear', sendYear, raw.slice(0,3));
      }
      const list = raw.map(d => {
        const dt = d.deadlineDate && d.deadlineTime ? dayjs(`${d.deadlineDate} ${d.deadlineTime}`) : null;
        return {
          ...d,
          deadline_at_local: dt,
          deadline_th: dt ? dt.format('D MMM BBBB เวลา HH:mm น.') : null,
          deadline_day_th: dt ? dt.format('dddd D MMM') : null
        };
      });
      setDeadlines(list);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [academicYear]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!refreshIntervalMs) return;
    const id = setInterval(load, refreshIntervalMs);
    return () => clearInterval(id);
  }, [refreshIntervalMs, load]);

  return { deadlines, loading, error, reload: load };
}
