/**
 * Helper Hook สำหรับตรวจสอบเงื่อนไขการเข้าถึงระบบฝึกงาน
 * ✅ ตรวจสอบทั้ง CS05 และ ACCEPTANCE_LETTER
 */

import { useState, useEffect, useCallback } from 'react';
import internshipService from '../services/internshipService';

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
  const [loading, setLoading] = useState(true);
  const [cs05Status, setCS05Status] = useState(null);
  const [acceptanceStatus, setAcceptanceStatus] = useState(null);
  const [cs05Data, setCS05Data] = useState(null);
  const [acceptanceData, setAcceptanceData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // ฟังก์ชันตรวจสอบสถานะ
  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // 1. ตรวจสอบ CS05
      const cs05Response = await internshipService.getCurrentCS05();
      
      if (!cs05Response.success || !cs05Response.data) {
        setErrorMessage('ไม่พบข้อมูล CS05 กรุณายื่นคำร้องขอฝึกงาน');
        setCS05Status(null);
        setAcceptanceStatus(null);
        return;
      }

      const cs05 = cs05Response.data;
      setCS05Status(cs05.status);
      setCS05Data(cs05);

      console.log('[useInternshipAccess] CS05 Status:', {
        status: cs05.status,
        documentId: cs05.documentId
      });

      // 2. ตรวจสอบ CS05 ต้องเป็น approved ก่อน
      if (cs05.status !== 'approved') {
        setErrorMessage(
          cs05.status === 'pending' 
            ? 'คำร้อง CS05 อยู่ระหว่างการพิจารณา'
            : cs05.status === 'rejected'
            ? 'คำร้อง CS05 ไม่ได้รับการอนุมัติ'
            : `คำร้อง CS05 ยังไม่พร้อม (สถานะ: ${cs05.status})`
        );
        setAcceptanceStatus(null);
        return;
      }

      // 3. ตรวจสอบ ACCEPTANCE_LETTER
      try {
        const acceptanceResponse = await internshipService.checkAcceptanceLetterStatus(
          cs05.documentId
        );

        if (acceptanceResponse.success && acceptanceResponse.data) {
          const acceptance = acceptanceResponse.data;
          setAcceptanceStatus(acceptance.acceptanceStatus);
          setAcceptanceData(acceptance);

          console.log('[useInternshipAccess] Acceptance Status:', {
            status: acceptance.acceptanceStatus,
            canUpload: acceptance.canUpload
          });

          // ตั้งข้อความเตือนตามสถานะ
          if (acceptance.acceptanceStatus === 'not_uploaded') {
            setErrorMessage('ยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท');
          } else if (acceptance.acceptanceStatus === 'pending') {
            setErrorMessage('หนังสือตอบรับอยู่ระหว่างการพิจารณา');
          } else if (acceptance.acceptanceStatus === 'rejected') {
            setErrorMessage('หนังสือตอบรับไม่ได้รับการอนุมัติ กรุณาอัปโหลดใหม่');
          } else if (acceptance.acceptanceStatus === 'approved') {
            setErrorMessage(null); // ผ่านเงื่อนไขทั้งหมด
          }
        } else {
          setAcceptanceStatus('not_uploaded');
          setErrorMessage('ยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท');
        }
      } catch (acceptanceError) {
        console.error('[useInternshipAccess] Acceptance check error:', acceptanceError);
        
        if (acceptanceError.response?.status === 404) {
          setAcceptanceStatus('not_uploaded');
          setErrorMessage('ยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท');
        } else {
          setAcceptanceStatus('error');
          setErrorMessage('ไม่สามารถตรวจสอบสถานะหนังสือตอบรับได้');
        }
      }

    } catch (error) {
      console.error('[useInternshipAccess] Error:', error);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
      setCS05Status(null);
      setAcceptanceStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // คำนวณสิทธิ์การเข้าถึง
  const canAccess = cs05Status === 'approved' && acceptanceStatus === 'approved';
  const canEdit = canAccess; // ใช้เงื่อนไขเดียวกัน

  // ตรวจสอบแต่ละเงื่อนไข
  const hasCS05 = cs05Status !== null;
  const isCS05Approved = cs05Status === 'approved';
  const isCS05Pending = cs05Status === 'pending';
  const isCS05Rejected = cs05Status === 'rejected';

  const hasAcceptance = acceptanceStatus !== null && acceptanceStatus !== 'not_uploaded';
  const isAcceptanceApproved = acceptanceStatus === 'approved';
  const isAcceptancePending = acceptanceStatus === 'pending';
  const isAcceptanceRejected = acceptanceStatus === 'rejected';

  return {
    loading,
    cs05Status,
    acceptanceStatus,
    canAccess,
    canEdit,
    cs05Data,
    acceptanceData,
    errorMessage,
    refresh: checkStatus,
    
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
