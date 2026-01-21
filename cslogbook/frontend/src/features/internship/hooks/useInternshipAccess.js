/**
 * Helper Hook สำหรับตรวจสอบเงื่อนไขการเข้าถึงระบบฝึกงาน
 * ✅ ตรวจสอบทั้ง CS05 และ ACCEPTANCE_LETTER
 * ✅ เพิ่ม sessionStorage cache เพื่อลดการ fetch ซ้ำ
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import internshipService from 'features/internship/services/internshipService';

// Cache configuration
const CACHE_KEY = 'internshipAccessCache';
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (short for data freshness)

// Helper functions for sessionStorage cache
const getCache = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
};

const setCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore storage errors
  }
};

// Clear cache (for use when data changes)
export const clearInternshipAccessCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
};

/**
 * Custom Hook สำหรับตรวจสอบสถานะทั้ง CS05 และ ACCEPTANCE_LETTER
 * @returns {Object} { 
 *   loading, 
 *   cs05Status, 
 *   acceptanceStatus, 
 *   canAccess, 
 *   canEdit,
 *   cs05Data,
 *   acceptanceData,
 *   errorMessage,
 *   refresh 
 * }
 */
export const useInternshipAccess = () => {
  const isFetchingRef = useRef(false);
  
  // Lazy state initialization from cache
  const [state, setState] = useState(() => {
    const cached = getCache();
    if (cached) {
      return { ...cached, loading: false };
    }
    return {
      loading: true,
      cs05Status: null,
      acceptanceStatus: null,
      cs05Data: null,
      acceptanceData: null,
      errorMessage: null
    };
  });

  // ฟังก์ชันตรวจสอบสถานะ
  const checkStatus = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current && !force) return;

    // Check cache first (unless forced)
    if (!force) {
      const cached = getCache();
      if (cached) {
        setState(prev => ({ ...prev, ...cached, loading: false }));
        return;
      }
    }

    isFetchingRef.current = true;
    setState(prev => ({ ...prev, loading: true, errorMessage: null }));

    try {
      // 1. ตรวจสอบ CS05
      const cs05Response = await internshipService.getCurrentCS05();
      
      if (!cs05Response.success || !cs05Response.data) {
        const newState = {
          loading: false,
          cs05Status: null,
          acceptanceStatus: null,
          cs05Data: null,
          acceptanceData: null,
          errorMessage: 'ไม่พบข้อมูล CS05 กรุณายื่นคำร้องขอฝึกงาน'
        };
        setState(newState);
        return;
      }

      const cs05 = cs05Response.data;
      let newState = {
        loading: false,
        cs05Status: cs05.status,
        cs05Data: cs05,
        acceptanceStatus: null,
        acceptanceData: null,
        errorMessage: null
      };

      console.log('[useInternshipAccess] CS05 Status:', {
        status: cs05.status,
        documentId: cs05.documentId
      });

      // 2. ตรวจสอบ CS05 ต้องเป็น approved หรือ cancelled
      if (cs05.status !== 'approved' && cs05.status !== 'cancelled') {
        newState.errorMessage = 
          cs05.status === 'pending' 
            ? 'คำร้อง CS05 อยู่ระหว่างการพิจารณา'
            : cs05.status === 'rejected'
            ? 'คำร้อง CS05 ไม่ได้รับการอนุมัติ'
            : `คำร้อง CS05 ยังไม่พร้อม (สถานะ: ${cs05.status})`;
        setState(newState);
        setCache(newState);
        return;
      }

      // ✅ ถ้า CS05 เป็น cancelled ให้ข้ามการเช็ค Acceptance Letter
      if (cs05.status === 'cancelled') {
        newState.errorMessage = 'การฝึกงานนี้ถูกยกเลิกแล้ว คุณสามารถดูข้อมูลสรุปผลได้ แต่ไม่สามารถแก้ไขได้';
        newState.acceptanceStatus = 'cancelled';
        setState(newState);
        setCache(newState);
        return;
      }

      // 3. ตรวจสอบ ACCEPTANCE_LETTER
      try {
        const acceptanceResponse = await internshipService.checkAcceptanceLetterStatus(
          cs05.documentId
        );

        if (acceptanceResponse.success && acceptanceResponse.data) {
          const acceptance = acceptanceResponse.data;
          newState.acceptanceStatus = acceptance.acceptanceStatus;
          newState.acceptanceData = acceptance;

          console.log('[useInternshipAccess] Acceptance Status:', {
            status: acceptance.acceptanceStatus,
            canUpload: acceptance.canUpload
          });

          // ตั้งข้อความเตือนตามสถานะ
          if (acceptance.acceptanceStatus === 'not_uploaded') {
            newState.errorMessage = 'ยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท';
          } else if (acceptance.acceptanceStatus === 'pending') {
            newState.errorMessage = 'หนังสือตอบรับอยู่ระหว่างการพิจารณา';
          } else if (acceptance.acceptanceStatus === 'rejected') {
            newState.errorMessage = 'หนังสือตอบรับไม่ได้รับการอนุมัติ กรุณาอัปโหลดใหม่';
          } else if (acceptance.acceptanceStatus === 'approved') {
            newState.errorMessage = null; // ผ่านเงื่อนไขทั้งหมด
          }
        } else {
          newState.acceptanceStatus = 'not_uploaded';
          newState.errorMessage = 'ยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท';
        }
      } catch (acceptanceError) {
        console.error('[useInternshipAccess] Acceptance check error:', acceptanceError);
        
        if (acceptanceError.response?.status === 404) {
          newState.acceptanceStatus = 'not_uploaded';
          newState.errorMessage = 'ยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท';
        } else {
          newState.acceptanceStatus = 'error';
          newState.errorMessage = 'ไม่สามารถตรวจสอบสถานะหนังสือตอบรับได้';
        }
      }

      setState(newState);
      setCache(newState);

    } catch (error) {
      console.error('[useInternshipAccess] Error:', error);
      const errorState = {
        loading: false,
        cs05Status: null,
        acceptanceStatus: null,
        cs05Data: null,
        acceptanceData: null,
        errorMessage: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ'
      };
      setState(errorState);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // โหลดข้อมูลครั้งแรก (ถ้าไม่มี cache)
  useEffect(() => {
    const cached = getCache();
    if (!cached) {
      checkStatus();
    }
  }, [checkStatus]);

  // ✅ คำนวณสิทธิ์การเข้าถึง
  const canAccess = (state.cs05Status === 'approved' && state.acceptanceStatus === 'approved') || state.cs05Status === 'cancelled';
  const canEdit = state.cs05Status === 'approved' && state.acceptanceStatus === 'approved';

  // ตรวจสอบแต่ละเงื่อนไข
  const hasCS05 = state.cs05Status !== null;
  const isCS05Approved = state.cs05Status === 'approved';
  const isCS05Pending = state.cs05Status === 'pending';
  const isCS05Rejected = state.cs05Status === 'rejected';

  const hasAcceptance = state.acceptanceStatus !== null && state.acceptanceStatus !== 'not_uploaded';
  const isAcceptanceApproved = state.acceptanceStatus === 'approved';
  const isAcceptancePending = state.acceptanceStatus === 'pending';
  const isAcceptanceRejected = state.acceptanceStatus === 'rejected';

  return {
    loading: state.loading,
    cs05Status: state.cs05Status,
    acceptanceStatus: state.acceptanceStatus,
    canAccess,
    canEdit,
    cs05Data: state.cs05Data,
    acceptanceData: state.acceptanceData,
    errorMessage: state.errorMessage,
    refresh: (force = true) => checkStatus(force),
    
    // Helper flags
    hasCS05,
    isCS05Approved,
    isCS05Pending,
    isCS05Rejected,
    hasAcceptance,
    isAcceptanceApproved,
    isAcceptancePending,
    isAcceptanceRejected,
  };
};

export default useInternshipAccess;

