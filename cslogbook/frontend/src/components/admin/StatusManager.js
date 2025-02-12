
export const handleApprove = async (documentId) => {
  await fetch(`/api/documents/${documentId}/approve`, { method: 'POST' });
};

export const handleReject = async (documentId) => {
  await fetch(`/api/documents/${documentId}/reject`, { method: 'POST' });
};
