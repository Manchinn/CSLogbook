import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Dashboard = () => {
  const [role, setRole] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // ดึงข้อมูล Role และชื่อผู้ใช้จาก localStorage
    const userRole = localStorage.getItem('role');
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');

    if (!userRole) {
      navigate('/login');
    } else {
      setRole(userRole);
      setFirstName(firstName);
      setLastName(lastName);
    }
  }, [navigate]);

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Welcome to the Dashboard</Title>
      <p>สวัสดี, {firstName} {lastName}</p>

      {/* แสดงข้อความต้อนรับตาม Role */}
      {role === 'student' && <p>คุณสามารถจัดการการฝึกงานและโครงงานของคุณได้จากเมนูด้านซ้าย</p>}
      {role === 'teacher' && <p>ตรวจสอบและให้คำแนะนำโครงงานนักศึกษาได้จากเมนูด้านซ้าย</p>}
      {role === 'admin' && <p>จัดการข้อมูลนักศึกษาและรายวิชาได้จากเมนูด้านซ้าย</p>}
    </div>
  );
};

export default Dashboard;
