import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import internshipService from 'features/internship/services/internshipService';

// ✅ แก้ไข hook ให้รับ totalApprovedHours เป็น parameter
const useEvaluationStatus = (totalApprovedHours = 0) => {
  const [loading, setLoading] = useState(true);
  const [evaluationData, setEvaluationData] = useState(null);
  const [sending, setSending] = useState(false);
  const [internshipCriteria, setInternshipCriteria] = useState({
    totalApprovedHours: 0,
    isCompleted: false,
    hasMinimumHours: false
  });

  // ดึงข้อมูลสถานะการประเมิน
  const fetchEvaluationStatus = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching evaluation status...');
      
      const [evaluationResponse, summaryResponse] = await Promise.all([
        internshipService.getEvaluationFormStatus(),
        internshipService.getInternshipSummary()
      ]);
      
      console.log('📊 API Responses:', {
        evaluationResponse,
        summaryResponse
      });
      
      if (evaluationResponse.success) {
        console.log('✅ Evaluation Status Response:', evaluationResponse.data);
        
        const evaluationData = {
          ...evaluationResponse.data,
          canSendEvaluation: evaluationResponse.data.canSendEvaluation ?? true,
          notificationEnabled: evaluationResponse.data.notificationEnabled ?? true
        };
        
        console.log('🔧 Processed evaluation data:', evaluationData);
        setEvaluationData(evaluationData);
      } else {
        console.warn('⚠️ Evaluation response not successful:', evaluationResponse);
      }

      // ✅ ใช้ totalApprovedHours จาก props เป็นหลัก
      let finalHours = totalApprovedHours;
      
      // ถ้าไม่มีใน props ให้ดึงจาก summaryResponse
      if (!finalHours && summaryResponse.success && summaryResponse.data) {
        finalHours = summaryResponse.data.totalApprovedHours || 0;
      }
      
      const isCompleted = finalHours >= 240;
      
      const criteria = {
        totalApprovedHours: finalHours,
        isCompleted: isCompleted,
        hasMinimumHours: finalHours >= 240
      };
      
      console.log('✅ Internship Criteria calculated with props:', {
        totalApprovedHours,
        summaryHours: summaryResponse.data?.totalApprovedHours,
        finalHours,
        criteria
      });
      
      setInternshipCriteria(criteria);
      
    } catch (error) {
      console.error('❌ Error fetching evaluation status:', error);
      message.error('ไม่สามารถดึงข้อมูลสถานะการประเมินได้');
      setEvaluationData(null);
    } finally {
      setLoading(false);
    }
  }, [totalApprovedHours]); // ✅ เพิ่ม dependency

  // ส่งคำขอประเมิน
  const sendEvaluationRequest = useCallback(async (documentId) => {
    try {
      // ✅ ใช้ totalApprovedHours จาก props เป็นหลัก
      const currentHours = totalApprovedHours || internshipCriteria.totalApprovedHours || 0;
      const isCompleted = currentHours >= 240;
      
      console.log('🔍 Checking hours before sending:', {
        totalApprovedHours,
        internshipCriteriaHours: internshipCriteria.totalApprovedHours,
        currentHours,
        isCompleted
      });
      
      if (!isCompleted) {
        message.warning({
          content: `ยังไม่สามารถส่งแบบประเมินได้ กรุณาบันทึกการฝึกงานให้ครบ 240 ชั่วโมง (ปัจจุบัน: ${currentHours} ชั่วโมง)`,
          duration: 6,
          style: { marginTop: '20vh' }
        });
        return { success: false, error: { type: 'INSUFFICIENT_HOURS' } };
      }

      setSending(true);
      
      const response = await internshipService.sendEvaluationForm(documentId);
      
      if (response.success) {
        message.success(response.message);
        await fetchEvaluationStatus();
        return { success: true, data: response };
      }
    } catch (error) {
      console.error('Error sending evaluation:', error);
      
      // จัดการ error ตามประเภท
      switch (error.type) {
        case 'NOTIFICATION_DISABLED':
          message.error({
            content: error.message,
            duration: 8,
            style: { marginTop: '20vh' }
          });
          break;
        case 'ALREADY_SENT':
          message.warning(error.message);
          break;
        case 'DOCUMENT_NOT_FOUND':
          message.error('ไม่พบเอกสารที่ต้องการ กรุณาตรวจสอบข้อมูล');
          break;
        case 'INSUFFICIENT_HOURS':
          // จัดการแล้วข้างบน
          break;
        default:
          message.error('เกิดข้อผิดพลาดในการส่งคำขอประเมิน กรุณาลองใหม่อีกครั้ง');
      }
      
      return { success: false, error };
    } finally {
      setSending(false);
    }
  }, [fetchEvaluationStatus, internshipCriteria, totalApprovedHours]); // ✅ เพิ่ม dependency

  useEffect(() => {
    fetchEvaluationStatus();
  }, [fetchEvaluationStatus]);

  return {
    loading,
    sending,
    evaluationData,
    internshipCriteria,
    sendEvaluationRequest,
    refreshStatus: fetchEvaluationStatus
  };
};

export default useEvaluationStatus;