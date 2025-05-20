import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { documentService } from '../../../services/admin/documentService'; // Updated path

const DocumentContext = createContext();

const documentReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
      };
    default:
      return state;
  }
};

export const DocumentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(documentReducer, { documents: [] });

  useEffect(() => {
    const fetchDocuments = async () => {
      const docs = await documentService.getAllDocuments();
      dispatch({ type: 'SET_DOCUMENTS', payload: docs });
    };

    fetchDocuments();
  }, []);

  return (
    <DocumentContext.Provider value={{ state, dispatch }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocumentContext = () => {
  return useContext(DocumentContext);
};