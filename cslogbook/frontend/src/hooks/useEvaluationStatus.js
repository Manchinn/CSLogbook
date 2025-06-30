import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import internshipService from '../services/internshipService';

const useEvaluationStatus = () => {
  const [loading, setLoading] = useState(true);
  const [evaluationData, setEvaluationData] = useState(null);
  const [sending, setSending] = useState(false);
  // ✅ เพิ่ม state สำหรับตรวจสอบเกณฑ์การฝึกงาน
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
        
        // ✅ ตรวจสอบค่าที่สำคัญ
        const evaluationData = {
          ...evaluationResponse.data,
          // ตั้งค่าเริ่มต้นถ้าไม่มีข้อมูล
          canSendEvaluation: evaluationResponse.data.canSendEvaluation ?? true,
          notificationEnabled: evaluationResponse.data.notificationEnabled ?? true
        };
        
        console.log('🔧 Processed evaluation data:', evaluationData);
        setEvaluationData(evaluationData);
      } else {
        console.warn('⚠️ Evaluation response not successful:', evaluationResponse);
      }

      if (summaryResponse.success && summaryResponse.data) {
        // ✅ ใช้ totalApprovedHours จาก summaryResponse แทน totalHours
        const totalHours = summaryResponse.data.totalApprovedHours || 0;
        const isCompleted = totalHours >= 240;
        
        const criteria = {
          totalApprovedHours: totalHours,
          isCompleted: isCompleted,
          hasMinimumHours: totalHours >= 240
        };
        
        console.log('✅ Internship Criteria calculated:', criteria);
        setInternshipCriteria(criteria);
      } else {
        console.warn('⚠️ Summary response not successful:', summaryResponse);
        // ✅ เพิ่ม fallback กรณีไม่มีข้อมูล
        setInternshipCriteria({
          totalApprovedHours: 0,
          isCompleted: false,
          hasMinimumHours: false
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching evaluation status:', error);
      message.error('ไม่สามารถดึงข้อมูลสถานะการประเมินได้');
      setEvaluationData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ส่งคำขอประเมิน
  const sendEvaluationRequest = useCallback(async (documentId) => {
    try {
      // ✅ ตรวจสอบเงื่อนไขก่อนส่ง
      if (!internshipCriteria.isCompleted) {
        message.warning({
          content: `ยังไม่สามารถส่งแบบประเมินได้ กรุณาบันทึกการฝึกงานให้ครบ 240 ชั่วโมง (ปัจจุบัน: ${internshipCriteria.totalApprovedHours} ชั่วโมง)`,
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
  }, [fetchEvaluationStatus, internshipCriteria]);

  useEffect(() => {
    fetchEvaluationStatus();
  }, [fetchEvaluationStatus]);

  return {
    loading,
    sending,
    evaluationData,
    internshipCriteria, // ✅ เพิ่ม return criteria
    sendEvaluationRequest,
    refreshStatus: fetchEvaluationStatus
  };
};

export default useEvaluationStatus;