import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../../services/admin/documentService';
import { message } from 'antd';

/**
 * Hook สำหรับการจัดการเอกสารในส่วน Admin
 * @param {Object} options - ตัวเลือกสำหรับการดึงข้อมูล
 * @param {string} options.type - ประเภทเอกสาร ('all', 'internship', 'project')
 * @param {string} options.status - สถานะเอกสาร ('all', 'pending', 'approved', 'rejected')
 * @param {string} options.search - คำค้นหา
 */
export function useDocuments(options = {}) {
  const queryClient = useQueryClient();
  const { type = 'all', status = 'all', search = '' } = options;
  
  // ดึงรายการเอกสาร
  const documentsQuery = useQuery({
    queryKey: ['admin', 'documents', { type, status, search }],
    queryFn: () => documentService.getDocuments({ type, status, search }),
    staleTime: 1000 * 60 * 5, // 5 นาที
  });
  
  // อนุมัติเอกสาร
  const approveMutation = useMutation({
    mutationFn: documentService.approveDocument,
    onSuccess: (data, documentId) => {
      message.success('อนุมัติเอกสารเรียบร้อยแล้ว');
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการอนุมัติเอกสาร: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  // ปฏิเสธเอกสาร
  const rejectMutation = useMutation({
    mutationFn: documentService.rejectDocument,
    onSuccess: (data, documentId) => {
      message.success('ปฏิเสธเอกสารเรียบร้อยแล้ว');
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธเอกสาร: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  // ดึงรายละเอียดเอกสาร
  const useDocumentDetails = (documentId) => {
    return useQuery({
      queryKey: ['admin', 'documentDetails', documentId],
      queryFn: () => documentId ? documentService.getDocumentById(documentId) : null,
      enabled: !!documentId,
    });
  };
  
  return {
    documents: documentsQuery.data?.documents || [],
    statistics: documentsQuery.data?.statistics || { total: 0, pending: 0, approved: 0, rejected: 0 },
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    error: documentsQuery.error,
    refetch: documentsQuery.refetch,
    approveDocument: approveMutation.mutate,
    rejectDocument: rejectMutation.mutate,
    useDocumentDetails,
  };
}