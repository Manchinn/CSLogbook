import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import internshipService from '../services/internshipService';

const useEvaluationStatus = () => {
  const [loading, setLoading] = useState(true);
  const [evaluationData, setEvaluationData] = useState(null);
  const [sending, setSending] = useState(false);

  // ดึงข้อมูลสถานะการประเมิน
  const fetchEvaluationStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await internshipService.getEvaluationFormStatus();
      
      if (response.success) {
        // ✅ เพิ่มการ log เพื่อ debug
        console.log('🔍 Evaluation Status Response:', response.data);
        
        // ✅ ตรวจสอบค่า notificationEnabled
        if (response.data.notificationEnabled === undefined) {
          console.warn('⚠️ notificationEnabled is undefined, setting to true');
          response.data.notificationEnabled = true;
        }
        
        setEvaluationData(response.data);
      } else {
        console.warn('Failed to get evaluation status:', response.message);
        setEvaluationData(null);
      }
    } catch (error) {
      console.error('Error fetching evaluation status:', error);
      message.error('ไม่สามารถดึงข้อมูลสถานะการประเมินได้');
      setEvaluationData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ส่งคำขอประเมิน
  const sendEvaluationRequest = useCallback(async (documentId) => {
    try {
      setSending(true);
      
      const response = await internshipService.sendEvaluationForm(documentId);
      
      if (response.success) {
        message.success(response.message);
        // รีเฟรชข้อมูลหลังจากส่งสำเร็จ
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
            duration: 8, // แสดงนานขึ้นเพราะเป็นข้อมูลสำคัญ
            style: {
              marginTop: '20vh',
            },
          });
          break;
        case 'ALREADY_SENT':
          message.warning(error.message);
          break;
        case 'DOCUMENT_NOT_FOUND':
          message.error('ไม่พบเอกสารที่ต้องการ กรุณาตรวจสอบข้อมูล');
          break;
        default:
          message.error('เกิดข้อผิดพลาดในการส่งคำขอประเมิน กรุณาลองใหม่อีกครั้ง');
      }
      
      return { success: false, error };
    } finally {
      setSending(false);
    }
  }, [fetchEvaluationStatus]);

  useEffect(() => {
    fetchEvaluationStatus();
  }, [fetchEvaluationStatus]);

  return {
    loading,
    sending,
    evaluationData,
    sendEvaluationRequest,
    refreshStatus: fetchEvaluationStatus
  };
};

export default useEvaluationStatus;