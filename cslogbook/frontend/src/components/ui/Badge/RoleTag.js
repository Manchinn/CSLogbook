import React from 'react';
import { Tag, Tooltip } from 'antd';
import { getTagColor } from '../../../utils/roleColors';

// แสดงป้าย role พร้อม teacherType (สำหรับ teacher)
const RoleTag = ({ role, teacherType, style }) => {
  if (!role) return null;
  const color = getTagColor(role, teacherType);
  let label = '';
  let tooltip = '';

  switch (role) {
    case 'admin':
      label = 'ผู้ดูแลระบบ';
      tooltip = 'สิทธิ์ระดับผู้ดูแลระบบ';
      break;
    case 'teacher':
      if (teacherType === 'support') {
        label = 'เจ้าหน้าที่ภาควิชา';
        tooltip = 'Teacher (Support Staff)';
      } else {
        label = 'อาจารย์สายวิชาการ';
        tooltip = 'Teacher (Academic)';
      }
      break;
    case 'student':
      label = 'นักศึกษา';
      tooltip = 'Student User';
      break;
    default:
      label = role;
      tooltip = role;
  }

  return (
    <Tooltip title={tooltip}>
      <Tag color={color} style={{ marginTop: 4, ...style }} data-testid="role-tag">
        {label}
      </Tag>
    </Tooltip>
  );
};

export default RoleTag;
