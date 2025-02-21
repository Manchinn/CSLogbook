import React from 'react';
import { Modal, Button } from 'antd';

const DocumentDetails = ({ document, open, onClose }) => {
  return (
    <Modal
      title="รายละเอียดเอกสาร"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <div>
        <h3>{document?.document_name || document?.project_name_th}</h3>
        <p>ชื่อนักศึกษา: {document?.student_name}</p>
        <p>วันที่อัปโหลด: {document?.upload_date}</p>
        <p>สถานะ: {document?.status}</p>

        {document?.type === 'internship' && (
          <>
            <p>ชื่อบริษัท: {document?.company_name}</p>
            <p>ชื่อผู้ควบคุมงาน: {document?.contact_name}</p>
            <p>เบอร์โทรศัพท์: {document?.contact_phone}</p>
            <p>อีเมล: {document?.contact_email}</p>
            <p>เอกสารที่อัปโหลด:</p>
            <ul>
              {document?.uploaded_files && JSON.parse(document.uploaded_files).map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </>
        )}

        {document?.type === 'project' && (
          <>
            <p>ชื่อโครงการ (ภาษาไทย): {document?.project_name_th}</p>
            <p>ชื่อโครงการ (ภาษาอังกฤษ): {document?.project_name_en}</p>
            <p>รหัสนักศึกษา 1: {document?.student_id1}</p>
            <p>ชื่อนักศึกษา 1: {document?.student_name1}</p>
            <p>ประเภทนักศึกษา 1: {document?.student_type1}</p>
            <p>รหัสนักศึกษา 2: {document?.student_id2}</p>
            <p>ชื่อนักศึกษา 2: {document?.student_name2}</p>
            <p>ประเภทนักศึกษา 2: {document?.student_type2}</p>
            <p>แทร็ก: {document?.track}</p>
            <p>หมวดหมู่โครงการ: {document?.project_category}</p>
          </>
        )}
        
        <Button onClick={() => window.open(`/documents/${document?.fileName}`, "_blank")}>
          ดาวน์โหลดเอกสาร
        </Button>
      </div>
    </Modal>
  );
};

export default DocumentDetails;
