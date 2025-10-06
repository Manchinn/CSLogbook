import { useState, useEffect } from 'react';
import * as importantDeadlineService from '../../services/admin/importantDeadlineService';
import { normalizeList } from '../../utils/deadlineNormalize';
import dayjs from '../../utils/dayjs';

// hook สำหรับดึงและจัดการกำหนดการสำคัญ
export default function useImportantDeadlines({ academicYear, semester }) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const res = await importantDeadlineService.getDeadlines({ academicYear, semester });
      const raw = res.data?.data || [];
      // Normalize + เติม legacy fields (fallback) เพื่อให้คอมโพเนนต์ปัจจุบันไม่ต้อง refactor ทันที (quick win)
      const list = normalizeList(raw).map(d => {
        const patched = { ...d };
        // single deadline fallback
        if (!patched.deadlineDate && patched.deadline_at_local) {
          patched.deadlineDate = patched.deadline_at_local.format('YYYY-MM-DD');
          // ใช้เวลาเดิมหรือ derive 23:59:59 ถ้าไม่มีเวลา (กรณีบาง backend อาจไม่ส่ง)
          if (!patched.deadlineTime) {
            patched.deadlineTime = patched.deadline_at_local.format('HH:mm:ss');
          }
        }
        // window fallback (derive date/time จาก windowStartAt / windowEndAt ถ้าไม่มี legacy)
        if (patched.isWindow) {
          if (patched.windowStartAt && !patched.windowStartDate) {
            const ws = dayjs(patched.windowStartAt);
            patched.windowStartDate = ws.format('YYYY-MM-DD');
            patched.windowStartTime = ws.format('HH:mm:ss');
          }
            if (patched.windowEndAt && !patched.windowEndDate) {
            const we = dayjs(patched.windowEndAt);
            patched.windowEndDate = we.format('YYYY-MM-DD');
            patched.windowEndTime = we.format('HH:mm:ss');
          }
        }
        return patched;
      });
      setDeadlines(list);
    } catch (e) {
      setDeadlines([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeadlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quick win: ไม่ต้องการ recreate เมื่อ function identity เปลี่ยน
  }, [academicYear, semester]);

  return { deadlines, loading, fetchDeadlines };
} 