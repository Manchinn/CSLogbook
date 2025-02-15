import React from 'react';
import { Modal, Button } from 'antd';

const ModalComponent = ({ document, open, onClose }) => {
  return (
    <Modal
      title="รายละเอียดเอกสาร"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <div>
        <h3>{document?.documentName}</h3>
        <p>ชื่อนักศึกษา: {document?.studentName}</p>
        <p>วันที่อัปโหลด: {document?.uploadDate}</p>
        <embed
          src={`/documents/${document?.fileName}`}
          width="100%"
          height="400px"
        />
        <Button onClick={() => window.open(`/documents/${document?.fileName}`, "_blank")}>
          ดาวน์โหลดเอกสาร
        </Button>
      </div>
    </Modal>
  );
};

export default ModalComponent;
