import React from 'react';
import { Card, Row, Col, Statistic, Tooltip, Typography, Divider } from 'antd';
import { 
  BookOutlined, TrophyOutlined, BarChartOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงสถิติการศึกษา
const StudyStatistics = ({ student }) => {
  // หาค่าเกรดเฉลี่ยสะสม (ถ้ามี)
  const gpa = student.gpa || student.cumulativeGPA || 0;
  
  // จำนวนหน่วยกิตตามหลักสูตร (ปรับตามหลักสูตรที่เกี่ยวข้อง)
  const totalCreditsRequired = student.totalCreditsRequired || 127; // ค่าเริ่มต้น 127 หน่วยกิต
  const majorCreditsRequired = student.majorCreditsRequired || 57; // ค่าเริ่มต้น 57 หน่วยกิต
  
  // คำนวณร้อยละความคืบหน้า
  const totalCreditsProgress = Math.min(Math.round((student.totalCredits / totalCreditsRequired) * 100), 100);
  const majorCreditsProgress = Math.min(Math.round((student.majorCredits / majorCreditsRequired) * 100), 100);

  // ดึงข้อมูลเกรดและรายวิชาถ้ามี
  const currentSemester = student.currentSemester || {};
  const recentSubjects = student.recentSubjects || student.recentCourses || [];
  
  // ตรวจสอบความพร้อมในการจบการศึกษา
  const isReadyToGraduate = 
    student.totalCredits >= totalCreditsRequired && 
    student.majorCredits >= majorCreditsRequired && 
    student.internshipStatus === 'completed' && 
    student.projectStatus === 'completed';

  // ตรวจสอบสถานะการฝึกงานและโครงงานจากหลายแหล่งข้อมูลที่เป็นไปได้
  const internshipStatus = student.internshipStatus || 
    (student.internshipProgress && student.internshipProgress.progress >= 100 ? 'completed' : 
    (student.internshipProgress && student.internshipProgress.progress > 0 ? 'in_progress' : 'not_started'));
    
  const projectStatus = student.projectStatus || 
    (student.projectProgress && student.projectProgress.progress >= 100 ? 'completed' : 
    (student.projectProgress && student.projectProgress.progress > 0 ? 'in_progress' : 'not_started'));

  // สถานะผ่าน/ไม่ผ่านสำหรับการฝึกงานและโครงงาน
  const hasPassedInternship = internshipStatus === 'completed';
  const hasPassedProject = projectStatus === 'completed';

  return (
    <Card 
      title={
        <div>
          <BookOutlined style={{ marginRight: 8 }} />
          สถานะการศึกษา
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Tooltip title={`จำนวนหน่วยกิตสะสมทั้งหมด ${student.totalCredits || 0} จากที่ต้องการ ${totalCreditsRequired}`}>
            <Statistic 
              title="หน่วยกิตสะสม" 
              value={student.totalCredits || 0} 
              suffix={`/ ${totalCreditsRequired}`} 
              valueStyle={{ 
                color: student.totalCredits >= totalCreditsRequired ? '#52c41a' : '#1890ff' 
              }}
              prefix={<BarChartOutlined />}
            />
          </Tooltip>
          <Text type="secondary">{`ความคืบหน้า: ${totalCreditsProgress}%`}</Text>
        </Col>
        
        <Col xs={12} md={6}>
          <Tooltip title={`จำนวนหน่วยกิตวิชาเอก ${student.majorCredits || 0} จากที่ต้องการ ${majorCreditsRequired}`}>
            <Statistic 
              title="หน่วยกิตภาควิชา" 
              value={student.majorCredits || 0} 
              suffix={`/ ${majorCreditsRequired}`} 
              valueStyle={{ 
                color: student.majorCredits >= majorCreditsRequired ? '#52c41a' : '#faad14' 
              }}
              prefix={<BookOutlined />}
            />
          </Tooltip>
          <Text type="secondary">{`ความคืบหน้า: ${majorCreditsProgress}%`}</Text>
        </Col>
        
        <Col xs={12} md={6}>
          <Tooltip title={
            hasPassedInternship ? 'นักศึกษาผ่านการฝึกงานแล้ว' : 
            internshipStatus === 'in_progress' ? 'นักศึกษากำลังฝึกงาน' : 
            'นักศึกษายังไม่ผ่านการฝึกงาน'
          }>
            <Statistic 
              title="การฝึกงาน" 
              value={hasPassedInternship ? 'ผ่าน' : 
                    internshipStatus === 'in_progress' ? 'กำลังดำเนินการ' : 'ไม่ผ่าน'} 
              valueStyle={{ 
                color: hasPassedInternship ? '#52c41a' : 
                       internshipStatus === 'in_progress' ? '#1890ff' : '#faad14' 
              }}
              prefix={
                hasPassedInternship ? <CheckCircleOutlined /> : 
                internshipStatus === 'in_progress' ? <InfoCircleOutlined /> : <CloseCircleOutlined />
              }
            />
          </Tooltip>
        </Col>
        
        <Col xs={12} md={6}>
          <Tooltip title={
            hasPassedProject ? 'นักศึกษาผ่านโครงงานพิเศษแล้ว' : 
            projectStatus === 'in_progress' ? 'นักศึกษากำลังทำโครงงานพิเศษ' : 
            'นักศึกษายังไม่ผ่านโครงงานพิเศษ'
          }>
            <Statistic 
              title="โครงงานพิเศษ" 
              value={hasPassedProject ? 'ผ่าน' : 
                    projectStatus === 'in_progress' ? 'กำลังดำเนินการ' : 'ไม่ผ่าน'} 
              valueStyle={{ 
                color: hasPassedProject ? '#52c41a' : 
                       projectStatus === 'in_progress' ? '#1890ff' : '#faad14' 
              }}
              prefix={
                hasPassedProject ? <CheckCircleOutlined /> : 
                projectStatus === 'in_progress' ? <InfoCircleOutlined /> : <CloseCircleOutlined />
              }
            />
          </Tooltip>
        </Col>
      </Row>

      {/* ข้อมูลเพิ่มเติม */}
      {gpa > 0 && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Tooltip title="เกรดเฉลี่ยสะสม">
                <Statistic 
                  title="เกรดเฉลี่ยสะสม (GPAX)" 
                  value={gpa.toFixed(2)} 
                  precision={2}
                  valueStyle={{ 
                    color: gpa >= 3.5 ? '#52c41a' : 
                           gpa >= 3.0 ? '#1890ff' : 
                           gpa >= 2.0 ? '#faad14' : '#f5222d'
                  }}
                  prefix={<TrophyOutlined />}
                />
              </Tooltip>
            </Col>
            
            <Col xs={24} md={12}>
              <Tooltip title={isReadyToGraduate ? 'พร้อมสำหรับการจบการศึกษา' : 'ยังไม่พร้อมสำหรับการจบการศึกษา'}>
                <Statistic 
                  title="ความพร้อมในการจบการศึกษา" 
                  value={isReadyToGraduate ? 'พร้อม' : 'ยังไม่พร้อม'} 
                  valueStyle={{ color: isReadyToGraduate ? '#52c41a' : '#faad14' }}
                  prefix={isReadyToGraduate ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                />
              </Tooltip>
            </Col>
          </Row>
        </>
      )}
      
      {/* แสดงข้อมูลภาคการศึกษาปัจจุบันถ้ามี */}
      {currentSemester && currentSemester.name && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <div>
            <Text strong>ภาคเรียนปัจจุบัน: {currentSemester.name}</Text>
            {currentSemester.termGpa && (
              <Text style={{ marginLeft: 16 }}>
                เกรดเฉลี่ยภาค: {currentSemester.termGpa.toFixed(2)}
              </Text>
            )}
          </div>
          
          {/* แสดงวิชาล่าสุดถ้ามี */}
          {recentSubjects && recentSubjects.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text strong>วิชาที่ลงทะเบียนล่าสุด: </Text>
              <div>
                {recentSubjects.slice(0, 3).map((subject, index) => (
                  <Text key={index} style={{ display: 'block' }}>
                    - {subject.code} {subject.name} 
                    {subject.grade && ` (${subject.grade})`}
                  </Text>
                ))}
                {recentSubjects.length > 3 && (
                  <Text type="secondary">และอีก {recentSubjects.length - 3} วิชา</Text>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default StudyStatistics;