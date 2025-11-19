import React from 'react';
import DocumentManagement from 'components/admin/documents';

const InternshipDocs = () => {
  // ไม่จำเป็นต้องส่ง type เพราะกำหนดไว้ใน DocumentProvider แล้ว
  return <DocumentManagement />;
};

export default InternshipDocs;