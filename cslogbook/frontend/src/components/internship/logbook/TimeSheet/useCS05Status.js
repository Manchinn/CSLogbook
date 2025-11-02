/**
 * Custom Hook สำหรับตรวจสอบสถานะ CS05
 * ใช้เพื่อควบคุมการเข้าถึง Logbook/TimeSheet
 */

import { useState, useEffect } from 'react';
import internshipService from '../../../../services/internshipService';
import { message } from 'antd';

export const useCS05Status = () => {
  const [cs05Status, setCS05Status] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [cs05Data, setCS05Data] = useState(null);

  useEffect(() => {
    const checkCS05Status = async () => {
      try {
        setLoading(true);
        const response = await internshipService.getCurrentCS05();
        
        if (response.success && response.data) {
          const status = response.data.status;
          setCS05Status(status);
          setCS05Data(response.data);
          
          // ✅ อนุญาตเฉพาะ approved เท่านั้น
          setIsApproved(status === 'approved');
          
          console.log('[useCS05Status] CS05 Status:', {
            status,
            isApproved: status === 'approved',
            documentId: response.data.documentId
          });
        } else {
          setCS05Status(null);
          setIsApproved(false);
        }
      } catch (error) {
        console.error('[useCS05Status] Error:', error);
        setCS05Status(null);
        setIsApproved(false);
        
        // ไม่แสดง error message ถ้าเป็น 404 (ยังไม่มี CS05)
        if (error.response?.status !== 404) {
          message.error('ไม่สามารถตรวจสอบสถานะ CS05 ได้');
        }
      } finally {
        setLoading(false);
      }
    };

    checkCS05Status();
  }, []);

  return {
    cs05Status,
    loading,
    isApproved,
    cs05Data,
    // ฟังก์ชันช่วยตรวจสอบสถานะต่างๆ
    isPending: cs05Status === 'pending',
    isRejected: cs05Status === 'rejected',
    hasCS05: cs05Status !== null,
  };
};

export default useCS05Status;
