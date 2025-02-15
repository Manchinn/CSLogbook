import { API_URL } from './config';

export const fetchDocuments = async (type) => {
  const response = await fetch(`${API_URL}/documents?type=${type}`);
  const data = await response.json();
  return data;
};

export const handleApprove = async (documentId) => {
  await fetch(`${API_URL}/documents/${documentId}/approve`, { method: 'POST' });
};

export const handleReject = async (documentId) => {
  await fetch(`${API_URL}/documents/${documentId}/reject`, { method: 'POST' });
};

export const fetchStudentList = async () => {
  const response = await fetch(`${API_URL}/students`);
  const data = await response.json();
  return data;
};
