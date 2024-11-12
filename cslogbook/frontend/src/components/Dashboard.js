import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (!storedRole) {
      navigate('/login');
    } else {
      setRole(storedRole);
    }
  }, [navigate]);

  return (
    <div>
      <h2>Welcome to the Dashboard</h2>

      {/* ฟีเจอร์สำหรับนักศึกษา */}
      {role === 'student' && (
        <>
          <h3>Student Features</h3>
          <button>ดูสถานะฝึกงาน</button>
          <button>ดูสถานะโครงงาน</button>
          <button>อัปโหลดเอกสาร</button>
        </>
      )}

      {/* ฟีเจอร์สำหรับอาจารย์ที่ปรึกษา */}
      {role === 'teacher' && (
        <>
          <h3>Teacher Features</h3>
          <button>ตรวจสอบเอกสารโครงงาน</button>
          <button>ให้คำแนะนำโครงงาน</button>
          <button>อนุมัติเอกสาร</button>
        </>
      )}

      {/* ฟีเจอร์สำหรับเจ้าหน้าที่ภาควิชา */}
      {role === 'admin' && (
        <>
          <h3>Admin Features</h3>
          <button>จัดการข้อมูลนักศึกษา</button>
          <button>อัปเดตรายวิชา</button>
          <button>กำหนดสิทธิ์ฝึกงาน/โครงงาน</button>
        </>
      )}

      <button onClick={() => {
        localStorage.clear();
        navigate('/login');
      }}>Logout</button>
    </div>
  );
};

export default Dashboard;
