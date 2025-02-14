export const fetchDocuments = async (type) => {
  const response = await fetch(`/api/documents?type=${type}`);
  const data = await response.json();
  return data;
};

export const handleApprove = async (documentId) => {
  await fetch(`/api/documents/${documentId}/approve`, { method: 'POST' });
};

export const handleReject = async (documentId) => {
  await fetch(`/api/documents/${documentId}/reject`, { method: 'POST' });
};

export const fetchStudentList = async () => {
  const response = await fetch('/api/students');
  const data = await response.json();
  return data;
};
