import { useState, useEffect, useCallback } from "react";
import { documentService } from "../../services/admin/documentService";
import { message } from "antd";

/**
 * Hook สำหรับการจัดการเอกสารในส่วน Admin (useState/useEffect)
 * @param {Object} options - ตัวเลือกสำหรับการดึงข้อมูล
 * @param {string} options.type - ประเภทเอกสาร ('all', 'internship', 'project')
 * @param {string} options.status - สถานะเอกสาร ('all', 'pending', 'approved', 'rejected')
 * @param {string} options.search - คำค้นหา
 * @param {number} options.academicYear - ปีการศึกษา (พ.ศ.)
 * @param {number} options.semester - ภาคเรียน (1, 2, 3)
 * @param {number} options.limit - จำนวนรายการต่อหน้า
 * @param {number} options.offset - offset สำหรับ pagination
 */
export function useDocuments(options = {}) {
  const { 
    type = "all", 
    status = "", 
    search = "", 
    academicYear, 
    semester,
    limit,
    offset
  } = options;

  const [documents, setDocuments] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [total, setTotal] = useState(0); // Total count สำหรับ pagination
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
  // แปลงค่าสถานะว่างให้เป็น all เพื่อรองรับ backend filter
  const normalizedStatus = status === '' ? 'all' : status;
  const params = { 
    type, 
    status: normalizedStatus, 
    search 
  };
  
  // เพิ่ม academicYear และ semester ถ้ามีค่า
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  
  // เพิ่ม pagination params
  if (limit !== undefined) params.limit = limit;
  if (offset !== undefined) params.offset = offset;
  
  const data = await documentService.getDocuments(params);
      setDocuments(data.documents || []);
      setTotal(data.total || data.documents?.length || 0); // ใช้ total จาก backend หรือ fallback
      setStatistics({
        total: data.total || data.documents?.length || 0,
        pending: data.statistics?.pending || data.documents?.filter((doc) => doc.status === "pending").length || 0,
        approved: data.statistics?.approved || data.documents?.filter((doc) => doc.status === "approved").length || 0,
        rejected: data.statistics?.rejected || data.documents?.filter((doc) => doc.status === "rejected").length || 0,
      });
    } catch (err) {
      setIsError(true);
      setError(err);
      setDocuments([]);
      setTotal(0);
      setStatistics({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [type, status, search, academicYear, semester, limit, offset]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // อนุมัติเอกสาร
  const approveDocument = async (documentId) => {
    try {
      await documentService.approveDocument(documentId);
      message.success("อนุมัติเอกสารเรียบร้อยแล้ว");
      fetchDocuments();
    } catch (err) {
      message.error(
        "เกิดข้อผิดพลาดในการอนุมัติเอกสาร: " +
          (err.message || "กรุณาลองใหม่อีกครั้ง")
      );
    }
  };

  // ปฏิเสธเอกสาร
  const rejectDocument = async (documentId, reason) => {
    try {
      await documentService.rejectDocument(documentId, reason);
      message.success("ปฏิเสธเอกสารเรียบร้อยแล้ว");
      fetchDocuments();
    } catch (err) {
      message.error(
        "เกิดข้อผิดพลาดในการปฏิเสธเอกสาร: " +
          (err.message || "กรุณาลองใหม่อีกครั้ง")
      );
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
      documentService
        .getDocumentById(documentId)
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
    total, // Total count สำหรับ pagination
    isLoading,
    isError,
    error,
    refetch,
    approveDocument,
    rejectDocument,
    useDocumentDetails,
  };
}
