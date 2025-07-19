// src/contexts/InternshipStatusContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import internshipService from '../services/internshipService';

const InternshipStatusContext = createContext();

export const useInternshipStatus = () => useContext(InternshipStatusContext);

export const InternshipStatusProvider = ({ children }) => {
  const [status, setStatus] = useState({
    cs05Status: null,
    internshipDate: { startDate: null, endDate: null },
    summaryCompleted: null,
    certificateStatus: null,
    student: null,
    logbookStats: null,
    notifications: [],
    reflectionData: null,
    loading: true,
    error: null,
  });

  const fetchStatus = async () => {
    setStatus(s => ({ ...s, loading: true, error: null }));
    try {
      // 1. ข้อมูล CS05 + student
      const cs05Res = await internshipService.getCurrentCS05();
      let cs05Status = null, internshipDate = { startDate: null, endDate: null }, student = null;
      if (cs05Res.success && cs05Res.data) {
        cs05Status = cs05Res.data.status;
        internshipDate = {
          startDate: cs05Res.data.startDate,
          endDate: cs05Res.data.endDate,
        };
        // สมมติว่ามีข้อมูล student ใน cs05Res.data หรือดึงจาก API อื่น
        student = cs05Res.data.student || null;
      }

      // 2. ข้อมูล certificate (รวม summary)
      const certRes = await internshipService.getCertificateStatus();
      let summaryCompleted = null, certificateStatus = null;
      if (certRes.success && certRes.data) {
        summaryCompleted = certRes.data.requirements.summarySubmission.completed;
        certificateStatus = certRes.data.status;
      }

      // 3. ข้อมูล logbook stats (ถ้าต้องการ)
      let logbookStats = null;
      try {
        const logbookRes = await internshipService.getTimeSheetStats();
        if (logbookRes) logbookStats = logbookRes;
      } catch {}

      // 4. ข้อมูล reflection/สรุปผล (ถ้าต้องการ)
      let reflectionData = null;
      try {
        const reflectionRes = await internshipService.getInternshipSummary();
        if (reflectionRes.success && reflectionRes.data) {
          reflectionData = reflectionRes.data.reflectionData || null;
        }
      } catch {}

      // 5. ข้อมูล notifications (ถ้ามี)
      // let notifications = []; // ดึงจาก service ถ้ามี

      setStatus({
        cs05Status,
        internshipDate,
        summaryCompleted,
        certificateStatus,
        student,
        logbookStats,
        reflectionData,
        notifications: [], // เพิ่ม logic ดึงถ้ามี
        loading: false,
        error: null,
      });
    } catch (e) {
      setStatus(s => ({ ...s, loading: false, error: e.message }));
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  return (
    <InternshipStatusContext.Provider value={{ ...status, refresh: fetchStatus }}>
      {children}
    </InternshipStatusContext.Provider>
  );
};
