import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../../services/admin/documentService';
import { message } from 'antd';

/**
 * Hook สำหรับการจัดการเอกสารในส่วน Admin (useState/useEffect)
 * @param {Object} options - ตัวเลือกสำหรับการดึงข้อมูล
 * @param {string} options.type - ประเภทเอกสาร ('all', 'internship', 'project')
 * @param {string} options.status - สถานะเอกสาร ('all', 'pending', 'approved', 'rejected')
 * @param {string} options.search - คำค้นหา
 */
export function useDocuments(options = {}) {
  const { type = 'all', status = 'all', search = '' } = options;

  const [documents, setDocuments] = useState([]);
  const [statistics, setStatistics] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await documentService.getDocuments({ type, status, search });
      setDocuments(data.documents || []);
      setStatistics(data.statistics || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setIsError(true);
      setError(err);
      setDocuments([]);
      setStatistics({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [type, status, search]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // อนุมัติเอกสาร
  const approveDocument = async (documentId) => {
    try {
      await documentService.approveDocument(documentId);
      message.success('อนุมัติเอกสารเรียบร้อยแล้ว');
      fetchDocuments();
    } catch (err) {
      message.error('เกิดข้อผิดพลาดในการอนุมัติเอกสาร: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  };

  // ปฏิเสธเอกสาร
  const rejectDocument = async (documentId) => {
    try {
      await documentService.rejectDocument(documentId);
      message.success('ปฏิเสธเอกสารเรียบร้อยแล้ว');
      fetchDocuments();
    } catch (err) {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธเอกสาร: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  };

  // ดึงรายละเอียดเอกสาร
  const useDocumentDetails = (documentId) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!documentId) {
        setDetails(null);
        return;
      }
      setLoading(true);
      setError(null);
      documentService.getDocumentById(documentId)
        .then(setDetails)
        .catch(setError)
        .finally(() => setLoading(false));
    }, [documentId]);

    return { data: details, isLoading: loading, error };
  };

  const refetch = fetchDocuments;

  return {
    documents,
    statistics,
    isLoading,
    isError,
    error,
    refetch,
    approveDocument,
    rejectDocument,
    useDocumentDetails,
  };
}