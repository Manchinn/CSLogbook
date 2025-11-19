// PDPAModal.js
import React from 'react';
import { Modal } from 'antd';

const PDPAModal = ({ visible, onOk, onCancel }) => {
  return (
    <Modal
      title="ข้อตกลงการใช้ข้อมูลส่วนบุคคล"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="ยอมรับและดำเนินการต่อ"
      cancelText="ยกเลิก"
    >
      <div style={{ marginBottom: 16 }}>
        <h4>การแก้ไขข้อมูลการศึกษา</h4>
        <p>ข้อมูลที่ท่านกำลังแก้ไขเป็นข้อมูลสำคัญที่ใช้ในการประเมินสิทธิ์:</p>
        <ul>
          <li>การลงทะเบียนฝึกงาน</li>
          <li>การลงทะเบียนโครงงานพิเศษ</li>
        </ul>
        <p>ข้อมูลดังกล่าวจะถูกนำไปใช้เพื่อ:</p>
        <ul>
          <li>ตรวจสอบคุณสมบัติการลงทะเบียน</li>
          <li>ประเมินความพร้อมในการฝึกงานและทำโครงงานพิเศษ</li>
          <li>วิเคราะห์ข้อมูลทางการศึกษา</li>
        </ul>
        <p style={{ marginTop: 16, fontWeight: "bold" }}>
          กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนทำการแก้ไข
          เนื่องจากจะมีผลต่อการประเมินสิทธิ์ของท่าน
        </p>
      </div>
    </Modal>
  );
};

export default PDPAModal;