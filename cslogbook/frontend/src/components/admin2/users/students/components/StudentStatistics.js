import React from 'react';
import { Typography } from 'antd';
import { UserAddOutlined, BookOutlined, ProjectOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const StudentStatistics = ({ statistics }) => {
/*   const noEligibility = (statistics?.total || 0) - 
                       (statistics?.internshipEligible || 0) - 
                       (statistics?.projectEligible || 0); */
  
  const items = [
    { icon: <UserAddOutlined />, text: `นักศึกษาทั้งหมด: ${statistics?.total || 0} คน`, key: "total" },
    { icon: <BookOutlined />, text: `มีสิทธิ์ฝึกงาน: ${statistics?.internshipEligible || 0}`, key: "internship" },
    { icon: <ProjectOutlined />, text: `มีสิทธิ์โครงงานพิเศษ: ${statistics?.projectEligible || 0}`, key: "project" },
    { icon: <CloseCircleOutlined />, text: `ไม่มีสิทธิ์: ${statistics?.noEligibility || 0}`, key: "none" }
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