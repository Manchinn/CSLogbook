import { API_URL } from './config';

const getToken = () => {
  return localStorage.getItem('token');
};

export const fetchDocuments = async (type) => {
  const response = await fetch(`${API_URL}/documents?type=${type}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Data is not an array');
  }
  return data;
};

export const handleApprove = async (documentId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to approve document');
  }
  // อัปเดตค่าใน database
  await fetch(`${API_URL}/internship-documents/${documentId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
};

export const handleReject = async (documentId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to reject document');
  }
  // อัปเดตค่าใน database
  await fetch(`${API_URL}/internship-documents/${documentId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
};

export const fetchStudentList = async () => {
  const response = await fetch(`${API_URL}/students`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Data is not an array');
  }
  return data;
};

export const fetchProjectProposals = async () => {
  const response = await fetch(`${API_URL}/project-proposals`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Data is not an array');
  }
  return data;
};

export const handleRejectProjectProposal = async (documentId) => {
  await fetch(`${API_URL}/project-proposals/${documentId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
};

export const fetchProjectDocuments = async () => {
  const response = await fetch(`${API_URL}/documents?type=project`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Data is not an array');
  }
  return data;
};

export const fetchInternshipDocuments = async () => {
  const response = await fetch(`${API_URL}/internship-documents`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Data is not an array');
  }
  return data;
};
