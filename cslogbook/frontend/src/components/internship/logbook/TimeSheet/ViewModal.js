import React from 'react';
import { Modal, Button } from 'antd';
import dayjs from 'dayjs';

const ViewModal = ({ visible, entry, onClose }) => {
  return (
    <Modal
      title="รายละเอียดการฝึกงาน"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          ปิด
        </Button>,
      ]}
    >
      <div className="view-details">
        <p>
          <strong>วันที่:</strong>{" "}
          {entry && dayjs(entry.workDate).format("DD/MM/YYYY")}
        </p>
        <p>
          <strong>หัวข้องาน:</strong> {entry?.logTitle}
        </p>
        <p>
          <strong>จำนวนชั่วโมง:</strong> {entry?.workHours} ชั่วโมง
        </p>
        <p>
          <strong>รายละเอียดงาน:</strong>
        </p>
        <p>{entry?.workDescription}</p>
        <p>
          <strong>สิ่งที่ได้เรียนรู้:</strong>
        </p>
        <p>{entry?.learningOutcome}</p>
        <p>
          <strong>ปัญหาที่พบ:</strong>
        </p>
        <p>{entry?.problems || "-"}</p>
        <p>
          <strong>วิธีการแก้ไข:</strong>
        </p>
        <p>{entry?.solutions || "-"}</p>
        {entry?.supervisorComment && (
          <>
            <p>
              <strong>ความคิดเห็นหัวหน้างาน:</strong>
            </p>
            <p>{entry.supervisorComment}</p>
          </>
        )}
        {entry?.advisorComment && (
          <>
            <p>
              <strong>ความคิดเห็นอาจารย์ที่ปรึกษา:</strong>
            </p>
            <p>{entry.advisorComment}</p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ViewModal;