// src/contexts/InternshipStatusContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { internshipService } from 'features/internship/services';

const InternshipStatusContext = createContext();

// Cache configuration
const CACHE_KEY = 'internshipStatusCache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Helper functions for localStorage cache (js-cache-storage)
const getCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
};

const setCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore storage errors (e.g., quota exceeded, private browsing)
  }
};

export const useInternshipStatus = () => useContext(InternshipStatusContext);

export const InternshipStatusProvider = ({ children }) => {
  const isFetchingRef = useRef(false);
  const [status, setStatus] = useState(() => {
    // Lazy state initialization with cache (rerender-lazy-state-init)
    const cached = getCache();
    if (cached) {
      return { ...cached, loading: false, error: null };
    }
    return {
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
    };
  });

  const fetchStatus = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    // Check cache first (unless forced)
    if (!force) {
      const cached = getCache();
      if (cached) {
        setStatus(s => ({ ...s, ...cached, loading: false, error: null }));
        return;
      }
    }

    isFetchingRef.current = true;
    setStatus(s => ({ ...s, loading: true, error: null }));
    
    try {
      // Use Promise.all for parallel fetching (async-parallel)
      const [cs05Res, certRes] = await Promise.all([
        internshipService.getCurrentCS05(),
        internshipService.getCertificateStatus()
      ]);

      let cs05Status = null, internshipDate = { startDate: null, endDate: null }, student = null;
      let totalCredits = null, majorCredits = null;

      if (cs05Res.success && cs05Res.data) {
        cs05Status = cs05Res.data.status;
        internshipDate = {
          startDate: cs05Res.data.startDate,
          endDate: cs05Res.data.endDate,
        };
        student = cs05Res.data.student || null;
        totalCredits = student?.totalCredits ?? null;
        majorCredits = student?.majorCredits ?? null;
      }

      let summaryCompleted = null, certificateStatus = null;
      if (certRes.success && certRes.data) {
        summaryCompleted = certRes.data.requirements.summarySubmission.completed;
        certificateStatus = certRes.data.status;
      }

      // Fetch optional data in parallel (non-blocking)
      let logbookStats = null;
      let reflectionData = null;
      
      try {
        const [logbookRes, reflectionRes] = await Promise.all([
          internshipService.getTimeSheetStats().catch(() => null),
          internshipService.getInternshipSummary().catch(() => ({ success: false }))
        ]);
        
        if (logbookRes) logbookStats = logbookRes;
        if (reflectionRes?.success && reflectionRes.data) {
          reflectionData = reflectionRes.data.reflectionData || null;
        }
      } catch {}

      let internshipEligibility = student?.requirements?.internshipEligibility || null;
      let internshipStatus = "in_progress";
      if (summaryCompleted && certificateStatus === "ready") {
        internshipStatus = "completed";
      }

      const newStatus = {
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
        eligibility: {
          internship: internshipEligibility,
        },
      };

      // Save to cache
      setCache(newStatus);
      setStatus(newStatus);
    } catch (e) {
      setStatus(s => ({ ...s, loading: false, error: e.message }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Only fetch if we don't have valid cached data
    const cached = getCache();
    if (!cached) {
      fetchStatus();
    }
  }, [fetchStatus]);

  return (
    <InternshipStatusContext.Provider value={{ ...status, refresh: (force = true) => fetchStatus(force) }}>
      {children}
    </InternshipStatusContext.Provider>
  );
};
