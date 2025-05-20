import { useState, useEffect, useCallback } from "react";
import { documentService } from "../../../services/admin/documentService"; // Updated import path
import { message } from "antd";

/**
 * Hook สำหรับการจัดการเอกสารในส่วน Admin (useState/useEffect)
 * @param {Object} options - ตัวเลือกสำหรับการดึงข้อมูล
 * @param {string} options.type - ประเภทเอกสาร ('all', 'internship', 'project')
 * @param {string} options.status - สถานะเอกสาร ('all', 'pending', 'approved', 'rejected')
 * @param {string} options.search - คำค้นหา
 */
export function useDocuments(options = {}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getDocuments(options);
      setDocuments(response.data);
    } catch (err) {
      setError(err);
      message.error("ไม่สามารถดึงข้อมูลเอกสารได้");
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error };
}