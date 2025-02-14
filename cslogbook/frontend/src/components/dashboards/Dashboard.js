import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const [role, setRole] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    studentID: '',
    isEligibleForInternship: false,
    isEligibleForProject: false
  });
  const [studentStats, setStudentStats] = useState({
    total: 0,
    internshipEligible: 0,
    projectEligible: 0
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedStudentID = localStorage.getItem('studentID');

    if (!token) {
      message.error('กรุณาเข้าสู่ระบบ');
      navigate('/login');
      return;
    }

    setRole(storedRole);

    if (storedStudentID) {
      axios.get(`http://localhost:5000/api/students/${storedStudentID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          const userData = response.data;
          setUserData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            studentID: userData.studentID,
            isEligibleForInternship: userData.isEligibleForInternship || false,
            isEligibleForProject: userData.isEligibleForProject || false
          });
          
          localStorage.setItem('firstName', userData.firstName);
          localStorage.setItem('lastName', userData.lastName);
          localStorage.setItem('isEligibleForInternship', userData.isEligibleForInternship);
          localStorage.setItem('isEligibleForProject', userData.isEligibleForProject);
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
        });
    }

    if (storedRole === 'admin') {
      fetchStudentStats();
    }
  }, []);

  const fetchStudentStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching with token:', token);
      
      if (!token) {
        message.error('กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Student stats response:', response.data);
      
      const students = response.data;
      const onlyStudents = students.filter(user => user.role === 'student');
      
      setStudentStats({
        total: onlyStudents.length,
        internshipEligible: onlyStudents.filter(student => student.isEligibleForInternship).length,
        projectEligible: onlyStudents.filter(student => student.isEligibleForProject).length
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
      if (error.response?.status === 403) {
        message.error('ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '8px' }}>
      {role === 'student' && <StudentDashboard userData={userData} navigate={navigate} />}
      {role === 'teacher' && <TeacherDashboard userData={userData} navigate={navigate} />}
      {role === 'admin' && <AdminDashboard userData={userData} studentStats={studentStats} loading={loading} navigate={navigate} />}
    </div>
  );
};

export default Dashboard;