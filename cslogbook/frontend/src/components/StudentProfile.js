import React, { useState, useEffect } from 'react';
import { Typography, Card, Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

function StudentProfile() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { studentID } = useParams(); // รับ studentID จาก URL

  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/check-eligibility/${studentID}`);
        setStudentData(response.data);
      } catch (error) {
        message.error("Error fetching student eligibility data.");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEligibility();
  }, [studentID]);

  if (loading) return <Spin tip="Loading..." />;

  if (!studentData) return <Text type="danger">No data found for the student.</Text>;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>ประวัตินักศึกษา</Title>
      <Card style={{ backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <Text>รหัสนักศึกษา: {studentData.studentID}</Text>
        <br />
        <Text>สิทธิ์ฝึกงาน: {studentData.isEligibleForInternship ? 'มี' : 'ไม่มี'}</Text>
        <br />
        <Text>สิทธิ์ทำโครงงานพิเศษ: {studentData.isEligibleForProject ? 'มี' : 'ไม่มี'}</Text>
      </Card>
    </div>
  );
}

export default StudentProfile;
