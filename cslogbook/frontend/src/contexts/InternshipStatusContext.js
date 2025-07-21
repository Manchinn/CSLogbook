// src/contexts/InternshipStatusContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import internshipService from '../services/internshipService';
import { 
  getInternshipRequirements, 
  isEligibleForInternship,
  calculateStudentYear
} from '../utils/studentUtils';

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
    eligibility: {
      internship: null,
    },
  });

  const fetchStatus = async () => {
    setStatus(s => ({ ...s, loading: true, error: null }));
    try {
      // 1. ข้อมูล CS05 + student
      const cs05Res = await internshipService.getCurrentCS05();
      let cs05Status = null, internshipDate = { startDate: null, endDate: null }, student = null;
      let totalCredits = null, majorCredits = null, gpa = null, recentSubjects = null;

      if (cs05Res.success && cs05Res.data) {
        cs05Status = cs05Res.data.status;
        internshipDate = {
          startDate: cs05Res.data.startDate,
          endDate: cs05Res.data.endDate,
        };
        student = cs05Res.data.student || null;

        // สมมติว่ามีข้อมูลเหล่านี้ใน student object
        totalCredits = student?.totalCredits ?? null;
        majorCredits = student?.majorCredits ?? null;
        gpa = student?.gpa ?? null;
        recentSubjects = student?.recentSubjects ?? null;
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

      // 5. Eligibility (ตรวจสอบสิทธิ์การฝึกงาน)
      let internshipEligibility = student?.requirements?.internshipEligibility || null;

      // 6. สถานะฝึกงาน (เช่น completed/in_progress)
      let internshipStatus = "in_progress";
      if (summaryCompleted && certificateStatus === "ready") {
        internshipStatus = "completed";
      }

      setStatus({
        cs05Status,
        internshipDate,
        summaryCompleted,
        certificateStatus,
        student,
        logbookStats,
        reflectionData,
        notifications: [],
        loading: false,
        error: null,
        internshipStatus,
        totalCredits,
        majorCredits,
        gpa,
        recentSubjects,
        eligibility: {
          internship: internshipEligibility,
        },
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
