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
  const [supervisorEvaluationStatus, setSupervisorEvaluationStatus] = useState('wait');
  const [internshipSummaryStatus, setInternshipSummaryStatus] = useState('not_submitted');
  const [totalHours, setTotalHours] = useState(0);
  const [approvedHours, setApprovedHours] = useState(0); // ✅ เพิ่ม state สำหรับ approved hours
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);

  // ✅ ตรวจสอบว่าสามารถขอหนังสือรับรองได้หรือไม่ (ใช้ approvedHours แทน totalHours)
  const canRequestCertificate = 
    approvedHours >= 240 && 
    supervisorEvaluationStatus === 'completed' && 
    certificateStatus === 'not_requested';

  /**
   * ดึงข้อมูลสถานะหนังสือรับรองทั้งหมด
   */
  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const certificateResponse = await internshipService.getCertificateStatus();

      if (certificateResponse.success && certificateResponse.data) {
        const data = certificateResponse.data;
        setCertificateStatus(data.status || 'not_requested');
        setCertificateData(data);

        // ✅ อัปเดตชั่วโมง (ทั้ง total และ approved)
        setTotalHours(data.requirements?.totalHours?.current || 0);
        setApprovedHours(data.requirements?.totalHours?.approved || 0);

        // อัปเดตสถานะการประเมิน
        const evalObj = data.requirements?.supervisorEvaluation;
        setSupervisorEvaluationStatus(
          evalObj == null
            ? 'wait'
            : evalObj.completed
              ? 'completed'
              : 'pending'
        );

        // อัปเดตสถานะสรุปผล
        setInternshipSummaryStatus(
          data.requirements?.summarySubmission?.completed ? 'submitted' : 'not_submitted'
        );
      } else if (certificateResponse.success && !certificateResponse.data) {
        // fallback: ยังไม่มีข้อมูล ให้ set สถานะเป็น wait
        setCertificateStatus('not_requested');
        setCertificateData(null);
        setTotalHours(0);
        setApprovedHours(0); // ✅ เพิ่ม reset approved hours
        setSupervisorEvaluationStatus('wait');
        setInternshipSummaryStatus('not_submitted');
        // ไม่ต้อง setError
      } else {
        // กรณีอื่นๆ ที่ไม่ใช่ fallback
        setError('ไม่สามารถดึงข้อมูลสถานะหนังสือรับรองได้');
      }
    } catch (error) {
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
        approvedHours: approvedHours, // ✅ เพิ่ม approved hours
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
  }, [canRequestCertificate, userData, totalHours, approvedHours, supervisorEvaluationStatus, internshipSummaryStatus]);

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
    approvedHours, // ✅ export approved hours
    loading,
    error,
    certificateData,
    
    // เงื่อนไขการขอหนังสือรับรอง
    canRequestCertificate,
    
    // ฟังก์ชันต่างๆ
    refreshStatus,
    submitCertificateRequest,
  };
};

export default useCertificateStatus;