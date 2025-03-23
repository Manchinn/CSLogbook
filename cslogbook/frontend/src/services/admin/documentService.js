import axios from 'axios';
import apiClient from '../apiClient';

const API_URL = process.env.REACT_APP_API_URL ;

const getToken = () => {
  return localStorage.getItem('token');
};

// รวมฟังก์ชันเกี่ยวกับเอกสารทั้งหมดเป็น Object เดียว
export const documentService = {
  // ดึงข้อมูลเอกสารทั้งหมด
  getAllDocuments: async (type = 'project') => {
    try {
      const response = await apiClient.get(`/documents?type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // อนุมัติเอกสาร
  approveDocument: async (documentId) => {
    try {
      const response = await apiClient.post(`/documents/${documentId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving document:', error);
      throw error;
    }
  },

  // ปฏิเสธเอกสาร
  rejectDocument: async (documentId) => {
    try {
      const response = await apiClient.post(`/documents/${documentId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting document:', error);
      throw error;
    }
  },

  // ดึงรายละเอียดเอกสาร
  getDocumentDetails: async (documentId) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document details:', error);
      throw error;
    }
  },

  // ดาวน์โหลดเอกสาร
  downloadDocument: async (documentId, fileName) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      // สร้าง URL จาก blob และดาวน์โหลด
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `document-${documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },
  
  // สร้างเอกสารใหม่
  createDocument: async (data) => {
    try {
      const response = await apiClient.post('/documents', data);
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  },
  
  // ลบเอกสาร
  deleteDocument: async (documentId) => {
    try {
      const response = await apiClient.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};

export default documentService;