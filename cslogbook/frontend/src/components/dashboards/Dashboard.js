import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';

const API_URL = 'http://localhost:5000/api';

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

  // Error handling utility
  const handleError = useCallback((error) => {
    if (error.response?.status === 403) {
      message.error('ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาเข้าสู่ระบบใหม่');
      navigate('/login');
    } else {
      message.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      console.error('Error:', error);
    }
  }, [navigate]);

  // API calls
  const fetchStudentData = useCallback(async (studentId, token) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);

  const fetchStudentStats = useCallback(async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const onlyStudents = response.data.filter(user => user.role === 'student');
      return {
        total: onlyStudents.length,
        internshipEligible: onlyStudents.filter(student => student.isEligibleForInternship).length,
        projectEligible: onlyStudents.filter(student => student.isEligibleForProject).length
      };
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Initialize dashboard data
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      const storedStudentID = localStorage.getItem('studentID');

      if (!token) {
        message.error('กรุณาเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      setRole(storedRole);

      try {
        if (storedStudentID) {
          const userData = await fetchStudentData(storedStudentID, token);
          const userDataToStore = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            studentID: userData.studentID,
            isEligibleForInternship: userData.isEligibleForInternship || false,
            isEligibleForProject: userData.isEligibleForProject || false
          };

          setUserData(userDataToStore);

          // Update localStorage
          Object.entries(userDataToStore).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
        }

        if (storedRole === 'admin') {
          const stats = await fetchStudentStats(token);
          setStudentStats(stats);
        }
      } catch (error) {
        handleError(error);
      }
    };

    initDashboard();
  }, [navigate, fetchStudentData, fetchStudentStats, handleError]);

  // Memoized props for child components
  const dashboardProps = {
    userData,
    navigate,
    studentStats,
    loading
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '8px' }}>
      {role === 'student' && <StudentDashboard {...dashboardProps} />}
      {role === 'teacher' && <TeacherDashboard {...dashboardProps} />}
      {role === 'admin' && <AdminDashboard {...dashboardProps} />}
    </div>
  );
};

export default Dashboard;