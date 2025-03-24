import React from 'react';
import { Typography } from 'antd';
import { UserAddOutlined, BookOutlined, ProjectOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const StudentStatistics = ({ statistics }) => {
  const items = [
    { icon: <UserAddOutlined />, text: `นักศึกษาทั้งหมด: ${statistics.total} คน`, key: "total" },
    { icon: <BookOutlined />, text: `มีสิทธิ์ฝึกงาน: ${statistics.eligibleInternship}`, key: "internship" },
    { icon: <ProjectOutlined />, text: `มีสิทธิ์โครงงานพิเศษ: ${statistics.eligibleProject}`, key: "project" },
    { icon: <CloseCircleOutlined />, text: `ไม่มีสิทธิ์: ${statistics.noEligibility}`, key: "none" }
  ];
  
  return (
    <div className="statistics-chips">
      {items.map(item => (
        <div className="statistic-item" key={item.key}>
          {item.icon}
          <Text>{item.text}</Text>
        </div>
      ))}
    </div>
  );
};

export default StudentStatistics;