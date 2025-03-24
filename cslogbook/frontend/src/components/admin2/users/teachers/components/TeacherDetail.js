import React from 'react';
import { Divider } from 'antd';

const TeacherDetail = ({ teacher }) => {
  if (!teacher) return null;
  
  return (
    <div className="teacher-detail">
      <Divider orientation="left">ข้อมูลทั่วไป</Divider>
      <p><strong>รหัสอาจารย์:</strong> {teacher.teacherCode}</p>
      <p><strong>ชื่อ-นามสกุล:</strong> {teacher.firstName} {teacher.lastName}</p>
      <p><strong>อีเมล:</strong> {teacher.email || '-'}</p>
      <p><strong>เบอร์ภายใน:</strong> {teacher.contactExtension || '-'}</p>
      <p><strong>ภาควิชา:</strong> {teacher.department || '-'}</p>
    </div>
  );
};

export default TeacherDetail;