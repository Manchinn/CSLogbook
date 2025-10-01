import React from 'react';
import { Divider } from 'antd';

const TeacherDetail = ({ teacher }) => {
  if (!teacher) return null;
  
  return (
    <div className="teacher-detail">
      <Divider orientation="left">ข้อมูลทั่วไป</Divider>
      <p><strong>รหัสอาจารย์:</strong> {teacher.teacherCode}</p>
      <p><strong>ชื่อ-นามสกุล:</strong> {teacher.firstName} {teacher.lastName}</p>
      <p><strong>ตำแหน่ง:</strong> {teacher.position || '-'}</p>
      <p><strong>อีเมล:</strong> {teacher.email || '-'}</p>
      <p><strong>สิทธิ์ Topic Exam Overview:</strong> {teacher.canAccessTopicExam ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</p>
      <p><strong>สิทธิ์ส่งออกรายชื่อ คพ.02:</strong> {teacher.canExportProject1 ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</p>
    </div>
  );
};

export default TeacherDetail;