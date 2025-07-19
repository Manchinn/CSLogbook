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
    loading: true,
    error: null,
  });

  const fetchStatus = async () => {
    setStatus(s => ({ ...s, loading: true, error: null }));
    try {
      const cs05Res = await internshipService.getCurrentCS05();
      let cs05Status = null, internshipDate = { startDate: null, endDate: null };
      if (cs05Res.success && cs05Res.data) {
        cs05Status = cs05Res.data.status;
        internshipDate = {
          startDate: cs05Res.data.startDate,
          endDate: cs05Res.data.endDate,
        };
      }
      const certRes = await internshipService.getCertificateStatus();
      let summaryCompleted = null, certificateStatus = null;
      if (certRes.success && certRes.data) {
        summaryCompleted = certRes.data.requirements.summarySubmission.completed;
        certificateStatus = certRes.data.status;
      }
      setStatus({
        cs05Status,
        internshipDate,
        summaryCompleted,
        certificateStatus,
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
