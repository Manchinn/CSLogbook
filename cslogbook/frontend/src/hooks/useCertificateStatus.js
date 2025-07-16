import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import internshipService from '../services/internshipService';

/**
 * Custom hook สำหรับจัดการสถานะการขอหนังสือรับรองการฝึกงาน
 * @returns {Object} สถานะและฟังก์ชันต่างๆ สำหรับจัดการหนังสือรับรอง
 */
const useCertificateStatus = () => {
  const { userData } = useAuth();
  
  // สถานะต่างๆ ของหนังสือรับรอง
  const [certificateStatus, setCertificateStatus] = useState('not_requested');
  const [supervisorEvaluationStatus, setSupervisorEvaluationStatus] = useState('pending');
  const [internshipSummaryStatus, setInternshipSummaryStatus] = useState('not_submitted');
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);

  // ตรวจสอบว่าสามารถขอหนังสือรับรองได้หรือไม่
  const canRequestCertificate = 
    totalHours >= 240 && 
    supervisorEvaluationStatus === 'completed' && 
    internshipSummaryStatus === 'submitted' &&
    certificateStatus === 'not_requested';

  /**
   * ดึงข้อมูลสถานะหนังสือรับรองทั้งหมด
   */
  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useCertificateStatus] กำลังดึงข้อมูลสถานะหนังสือรับรอง...');

      // เรียก API getCertificateStatus เป็นหลัก
      const certificateResponse = await internshipService.getCertificateStatus();
      
      if (certificateResponse.success && certificateResponse.data) {
        const data = certificateResponse.data;
        
        console.log('[useCertificateStatus] Certificate API response:', data);
        
        // อัปเดตสถานะตาม backend response
        setCertificateStatus(data.status || 'not_requested');
        setCertificateData(data);
        
        // ✅ อัปเดตชั่วโมงจาก backend
        if (data.requirements?.totalHours?.current !== undefined) {
          setTotalHours(data.requirements.totalHours.current);
          console.log('[useCertificateStatus] Total hours from backend:', data.requirements.totalHours.current);
        }
        
        // ✅ อัปเดตสถานะการประเมินจาก backend
        if (data.requirements?.supervisorEvaluation?.completed !== undefined) {
          const evalStatus = data.requirements.supervisorEvaluation.completed ? 'completed' : 'pending';
          setSupervisorEvaluationStatus(evalStatus);
          console.log('[useCertificateStatus] Evaluation status from backend:', evalStatus);
        }
        
        // ✅ อัปเดตสถานะสรุปผลจาก backend
        if (data.requirements?.summarySubmission?.completed !== undefined) {
          const summaryStatus = data.requirements.summarySubmission.completed ? 'submitted' : 'not_submitted';
          setInternshipSummaryStatus(summaryStatus);
          console.log('[useCertificateStatus] Summary status from backend:', summaryStatus);
        }
        
        console.log('[useCertificateStatus] ✅ อัปเดตสถานะทั้งหมดจาก backend เรียบร้อยแล้ว');
        
      } else {
        console.error('[useCertificateStatus] Certificate API failed:', certificateResponse);
        setError('ไม่สามารถดึงข้อมูลสถานะหนังสือรับรองได้');
      }

    } catch (error) {
      console.error('[useCertificateStatus] Error refreshing status:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ');
    } finally {
      setLoading(false);
    }
  }, []);

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
        studentId: userData.studentCode || userData.studentId,
        requestDate: new Date().toISOString(),
        totalHours: totalHours,
        evaluationStatus: supervisorEvaluationStatus,
        summaryStatus: internshipSummaryStatus
      };

      console.log('[useCertificateStatus] กำลังส่งคำขอหนังสือรับรอง...', requestData);

      const response = await internshipService.submitCertificateRequest(requestData);

      if (response.success) {
        setCertificateStatus('pending');
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
  }, [canRequestCertificate, userData, totalHours, supervisorEvaluationStatus, internshipSummaryStatus]);

  /**
   * ดาวน์โหลดหนังสือรับรองการฝึกงาน
   */
  const downloadCertificate = useCallback(async () => {
    try {
      if (certificateStatus !== 'ready') {
        throw new Error('หนังสือรับรองยังไม่พร้อม');
      }

      console.log('[useCertificateStatus] กำลังดาวน์โหลดหนังสือรับรอง...');
      await internshipService.downloadCertificate();
      
      console.log('[useCertificateStatus] ดาวน์โหลดสำเร็จ');
      return { success: true };
    } catch (error) {
      console.error('[useCertificateStatus] Error downloading certificate:', error);
      throw error;
    }
  }, [certificateStatus]);

  /**
   * แสดงตัวอย่างหนังสือรับรอง
   */
  const previewCertificate = useCallback(async () => {
    try {
      console.log('[useCertificateStatus] กำลังแสดงตัวอย่างหนังสือรับรอง...');
      await internshipService.previewCertificate();
      
      console.log('[useCertificateStatus] แสดงตัวอย่างสำเร็จ');
      return { success: true };
    } catch (error) {
      console.error('[useCertificateStatus] Error previewing certificate:', error);
      throw error;
    }
  }, []);

  // ดึงข้อมูลเมื่อ component โหลดครั้งแรก
  useEffect(() => {
    if (userData) {
      refreshStatus();
    }
  }, [userData, refreshStatus]);

  return {
    // สถานะต่างๆ
    certificateStatus,
    supervisorEvaluationStatus,
    internshipSummaryStatus,
    totalHours,
    loading,
    error,
    certificateData,
    
    // เงื่อนไขการขอหนังสือรับรอง
    canRequestCertificate,
    
    // ฟังก์ชันต่างๆ
    refreshStatus,
    submitCertificateRequest,
    downloadCertificate,
    previewCertificate
  };
};

export default useCertificateStatus;