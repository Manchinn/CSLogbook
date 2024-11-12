import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Card, Spin, Alert } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const StudentProfile = () => {
  const { studentID } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ตรวจสอบ studentID ที่ได้รับจาก URL
  console.log("Student ID from URL:", studentID);

  // ใช้ useEffect เพื่อดึงข้อมูลนักศึกษาจาก API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/check-eligibility/${studentID}`);
        console.log("API Response:", response.data);
        setStudent(response.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('ไม่พบข้อมูลนักศึกษา');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentID]);

  if (loading) {
    console.log("Loading student data...");
    return <Spin tip="Loading..." />;
  }

  if (error) {
    console.error("Error:", error);
    return <Alert message={error} type="error" />;
  }

  if (!student) {
    console.warn("No student data found");
    return <Text>ไม่พบข้อมูลนักศึกษา</Text>;
  }

  return (
    <Card style={{ margin: '24px', padding: '24px', borderRadius: '8px' }}>
      <Title level={2}>ประวัตินักศึกษา</Title>
      <Text><b>รหัสนักศึกษา:</b> {student.studentID}</Text>
      <br />
      <Text><b>สิทธิ์ฝึกงาน:</b> {student.isEligibleForInternship ? 'มี' : 'ไม่มี'}</Text>
      <br />
      <Text><b>สิทธิ์ทำโครงงานพิเศษ:</b> {student.isEligibleForProject ? 'มี' : 'ไม่มี'}</Text>
    </Card>
  );
};

export default StudentProfile;
