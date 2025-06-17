import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { documentService } from '../../services/admin/documentService';

// สร้าง initial state
const initialState = {
  documents: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: '',
  },
  selectedDocumentId: null,
  isModalVisible: false,
};

// สร้าง reducer สำหรับจัดการ state
const documentReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_DOCUMENTS_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_DOCUMENTS_SUCCESS':
      return { ...state, loading: false, documents: action.payload };
    case 'FETCH_DOCUMENTS_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_SEARCH_FILTER':
      return { ...state, filters: { ...state.filters, search: action.payload } };
    case 'SET_STATUS_FILTER':
      return { ...state, filters: { ...state.filters, status: action.payload } };
    case 'SHOW_DOCUMENT_DETAILS':
      return { ...state, selectedDocumentId: action.payload, isModalVisible: true };
    case 'HIDE_DOCUMENT_DETAILS':
      return { ...state, isModalVisible: false };
    case 'UPDATE_DOCUMENT_STATUS':
      return { 
        ...state, 
        documents: state.documents.map(doc => 
          doc.id === action.payload.id 
            ? { ...doc, status: action.payload.status } 
            : doc
        )
      };
    default:
      return state;
  }
};

// สร้าง Context
const DocumentContext = createContext();

// สร้าง Provider Component
export const DocumentProvider = ({ children, type = 'project' }) => {
  const [state, dispatch] = useReducer(documentReducer, initialState);
  
  // ฟังก์ชันสำหรับโหลดเอกสาร
  const loadDocuments = async () => {
    dispatch({ type: 'FETCH_DOCUMENTS_START' });
    try {
      // ใช้ documentService แทนการเรียก API โดยตรง
      const data = await documentService.getAllDocuments(type);
      dispatch({ type: 'FETCH_DOCUMENTS_SUCCESS', payload: data.documents || [] });
    } catch (error) {
      console.error('Error in DocumentContext.loadDocuments:', error);
      dispatch({ type: 'FETCH_DOCUMENTS_ERROR', payload: error.message });
    }
  };
  
  // โหลดเอกสารเมื่อ component mount หรือเมื่อ type เปลี่ยน
  useEffect(() => {
    loadDocuments();
  }, [type]);
  
  // ฟังก์ชันอนุมัติเอกสาร
  const approveDocument = async (documentId) => {
    try {
      // ใช้ documentService แทนการเรียก API โดยตรง
      await documentService.approveDocument(documentId);
      dispatch({ 
        type: 'UPDATE_DOCUMENT_STATUS', 
        payload: { id: documentId, status: 'approved' } 
      });
      return true;
    } catch (error) {
      console.error('Error approving document:', error);
      return false;
    }
  };
  
  // ฟังก์ชันปฏิเสธเอกสาร
  const rejectDocument = async (documentId) => {
    try {
      // ใช้ documentService แทนการเรียก API โดยตรง
      await documentService.rejectDocument(documentId);
      dispatch({ 
        type: 'UPDATE_DOCUMENT_STATUS', 
        payload: { id: documentId, status: 'rejected' } 
      });
      return true;
    } catch (error) {
      console.error('Error rejecting document:', error);
      return false;
    }
  };

  // ฟังก์ชันตั้งค่าการค้นหา
  const setSearchText = (text) => {
    dispatch({ type: 'SET_SEARCH_FILTER', payload: text });
  };

  // ฟังก์ชันตั้งค่าการกรองตามสถานะ
  const setStatusFilter = (status) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: status });
  };

  // ฟังก์ชันแสดงรายละเอียดเอกสาร
  const showDocumentDetails = (documentId) => {
    dispatch({ type: 'SHOW_DOCUMENT_DETAILS', payload: documentId });
  };

  // ฟังก์ชันซ่อนรายละเอียดเอกสาร
  const closeDocumentDetails = () => {
    dispatch({ type: 'HIDE_DOCUMENT_DETAILS' });
  };

  return (
    <DocumentContext.Provider value={{
      ...state,
      loadDocuments,
      approveDocument,
      rejectDocument,
      setSearchText,
      setStatusFilter,
      showDocumentDetails,
      closeDocumentDetails
    }}>
      {children}
    </DocumentContext.Provider>
  );
};

// Custom hook สำหรับใช้งาน Context
export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};