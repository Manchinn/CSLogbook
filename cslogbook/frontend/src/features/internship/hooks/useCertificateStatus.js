import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from 'contexts/AuthContext';
import internshipService from 'features/internship/services/internshipService';

// Cache configuration
const CACHE_KEY = 'certificateStatusCache';
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// Helper functions for sessionStorage cache
const getCache = (studentCode) => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp, forStudent } = JSON.parse(cached);
    if (forStudent === studentCode && Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
};

const setCache = (data, studentCode) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
      forStudent: studentCode
    }));
  } catch {}
};

// Clear cache (for use when data changes)
export const clearCertificateStatusCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
};

/**
 * Custom hook สำหรับจัดการสถานะการขอหนังสือรับรองการฝึกงาน
 * ✅ เพิ่ม sessionStorage cache เพื่อลดการ fetch ซ้ำ
 * @returns {Object} สถานะและฟังก์ชันต่างๆ สำหรับจัดการหนังสือรับรอง
 */
const useCertificateStatus = () => {
  const { userData } = useAuth();
  const isFetchingRef = useRef(false);
  const studentCode = userData?.studentCode || userData?.studentId;
  
  // Lazy state initialization from cache
  const [state, setState] = useState(() => {
    if (studentCode) {
      const cached = getCache(studentCode);
      if (cached) {
        return { ...cached, loading: false };
      }
    }
    return {
      certificateStatus: 'not_requested',
      supervisorEvaluationStatus: 'wait',
      internshipSummaryStatus: 'not_submitted',
      totalHours: 0,
      approvedHours: 0,
      loading: false,
      error: null,
      certificateData: null
    };
  });

  // ✅ ตรวจสอบว่าสามารถขอหนังสือรับรองได้หรือไม่
  const canRequestCertificate = 
    state.approvedHours >= 240 && 
    state.supervisorEvaluationStatus === 'completed' && 
    state.certificateStatus === 'not_requested';

  /**
   * ดึงข้อมูลสถานะหนังสือรับรองทั้งหมด
   */
  const refreshStatus = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current && !force) return;

    // Check cache first (unless forced)
    if (!force && studentCode) {
      const cached = getCache(studentCode);
      if (cached) {
        setState(prev => ({ ...prev, ...cached, loading: false }));
        return;
      }
    }

    isFetchingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const certificateResponse = await internshipService.getCertificateStatus();

      let newState = { loading: false, error: null };

      if (certificateResponse.success && certificateResponse.data) {
        const data = certificateResponse.data;
        newState.certificateStatus = data.status || 'not_requested';
        newState.certificateData = data;
        newState.totalHours = data.requirements?.totalHours?.current || 0;
        newState.approvedHours = data.requirements?.totalHours?.approved || 0;

        const evalObj = data.requirements?.supervisorEvaluation;
        newState.supervisorEvaluationStatus = evalObj == null
          ? 'wait'
          : evalObj.completed
            ? 'completed'
            : 'pending';

        newState.internshipSummaryStatus =
          data.requirements?.summarySubmission?.completed ? 'submitted' : 'not_submitted';
      } else if (certificateResponse.success && !certificateResponse.data) {
        newState.certificateStatus = 'not_requested';
        newState.certificateData = null;
        newState.totalHours = 0;
        newState.approvedHours = 0;
        newState.supervisorEvaluationStatus = 'wait';
        newState.internshipSummaryStatus = 'not_submitted';
      } else {
        newState.error = 'ไม่สามารถดึงข้อมูลสถานะหนังสือรับรองได้';
      }

      setState(prev => ({ ...prev, ...newState }));
      if (studentCode && !newState.error) {
        setCache(newState, studentCode);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ'
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [studentCode]);

  /**
   * ส่งคำขอหนังสือรับรองการฝึกงาน
   */
  const submitCertificateRequest = useCallback(async () => {
    try {
      if (!canRequestCertificate) {
        return {
          success: false,
          message: 'ยังไม่ผ่านเงื่อนไขการขอหนังสือรับรอง'
        };
      }

      const requestData = {
        studentId: studentCode,
        requestDate: new Date().toISOString(),
        totalHours: state.totalHours,
        approvedHours: state.approvedHours,
        evaluationStatus: state.supervisorEvaluationStatus,
        summaryStatus: state.internshipSummaryStatus
      };

      console.log('[useCertificateStatus] กำลังส่งคำขอหนังสือรับรอง...', requestData);

      const response = await internshipService.submitCertificateRequest(requestData);

      if (response.success) {
        setState(prev => ({ ...prev, certificateStatus: 'pending' }));
        // Clear cache so next load gets fresh data
        clearCertificateStatusCache();
        console.log('[useCertificateStatus] ส่งคำขอสำเร็จ');
        return { success: true, data: response.data };
      } else {
        console.error('[useCertificateStatus] ส่งคำขอล้มเหลว:', response.message);
        return {
          success: false,
          message: response.message || 'ไม่สามารถส่งคำขอได้'
        };
      }
    } catch (error) {
      console.error('[useCertificateStatus] Error submitting request:', error);
      return {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการส่งคำขอ'
      };
    }
  }, [canRequestCertificate, studentCode, state.totalHours, state.approvedHours, state.supervisorEvaluationStatus, state.internshipSummaryStatus]);

  // ดึงข้อมูลเมื่อ component โหลดครั้งแรก (ถ้าไม่มี cache)
  useEffect(() => {
    if (userData && studentCode) {
      const cached = getCache(studentCode);
      if (!cached) {
        refreshStatus();
      }
    }
  }, [userData, studentCode, refreshStatus]);

  return {
    // สถานะต่างๆ
    certificateStatus: state.certificateStatus,
    supervisorEvaluationStatus: state.supervisorEvaluationStatus,
    internshipSummaryStatus: state.internshipSummaryStatus,
    totalHours: state.totalHours,
    approvedHours: state.approvedHours,
    loading: state.loading,
    error: state.error,
    certificateData: state.certificateData,
    
    // เงื่อนไขการขอหนังสือรับรอง
    canRequestCertificate,
    
    // ฟังก์ชันต่างๆ
    refreshStatus: (force = true) => refreshStatus(force),
    submitCertificateRequest,
  };
};

export default useCertificateStatus;
