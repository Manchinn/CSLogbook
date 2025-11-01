import { useState } from 'react';
import internshipService from '../../../../services/internshipService';
import { message } from 'antd';

/**
 * Hook สำหรับจัดการฟอร์มบทสรุปการฝึกงาน
 * @param {Function} onSuccess ฟังก์ชันที่จะทำงานเมื่อบันทึกสำเร็จ
 * @returns {Object} ฟังก์ชันและสถานะสำหรับจัดการการบันทึก
 */
export function useReflectionForm(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveReflection = async (reflectionData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await internshipService.saveReflection(reflectionData);
      if (response.success) {
        message.success('บันทึกบทสรุปการฝึกงานเรียบร้อยแล้ว');
        if (onSuccess) {
          onSuccess(response.data);
        }
        return response.data;
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      const errorMsg = err.message || 'ไม่สามารถบันทึกบทสรุปการฝึกงาน';
      message.error(errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    saveReflection
  };
}

/**
 * Hook สำหรับจัดการการส่งแบบประเมินให้ผู้ควบคุมงาน
 * @param {Function} onSuccess ฟังก์ชันที่จะทำงานเมื่อส่งสำเร็จ
 * @returns {Object} ฟังก์ชันและสถานะสำหรับการส่งแบบประเมิน
 */
export function useEvaluationForm(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendEvaluationForm = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await internshipService.sendEvaluationForm(data);
      if (response.success) {
        message.success('ส่งแบบประเมินให้ผู้ควบคุมงานเรียบร้อยแล้ว');
        if (onSuccess) {
          onSuccess(response.data);
        }
        return response.data;
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาดในการส่งแบบประเมิน');
      }
    } catch (err) {
      const errorMsg = err.message || 'ไม่สามารถส่งแบบประเมินให้ผู้ควบคุมงานได้';
      message.error(errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sendEvaluationForm
  };
}
