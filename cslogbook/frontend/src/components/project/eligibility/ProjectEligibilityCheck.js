import React, { useState } from 'react';
import { Card, Typography, Divider, Steps, Alert, Spin, Button, Row, Col, Statistic, Table } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined, 
  LoadingOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  BookOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useStudentEligibility } from '../../../contexts/StudentEligibilityContext';
import './styles.css';

const { Title, Paragraph, Text } = Typography;

const ProjectEligibilityCheck = () => {
  const { 
    canAccessProject,
    canRegisterProject,
    messages,
    requirements,
    academicSettings,
    refreshEligibility,
    isLoading,
  } = useStudentEligibility();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEligibility(true);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // คุณสมบัติที่จำเป็นสำหรับโครงงานพิเศษ
  const requiredCredits = requirements?.project?.totalCredits || 95;
  const requiredMajorCredits = requirements?.project?.majorCredits || 47;
  const allowedSemesters = requirements?.project?.allowedSemesters || [1, 2];
  const requiresInternship = requirements?.project?.requireInternship || false;
  
  // สถานะปัจจุบันของนักศึกษา
  const studentStatus = {
    totalCredits: requirements?.status?.project?.currentCredits || 0,
    majorCredits: requirements?.status?.project?.currentMajorCredits || 0,
    currentTerm: academicSettings?.currentSemester || 1,
    currentAcademicYear: academicSettings?.currentAcademicYear || new Date().getFullYear() + 543,
    completedInternship: requirements?.status?.completedInternship || false
  };

  // คำนวณว่าผ่านเกณฑ์หรือไม่
  const passCredits = studentStatus.totalCredits >= requiredCredits;
  const passMajorCredits = studentStatus.majorCredits >= requiredMajorCredits;
  const isAllowedSemester = allowedSemesters.includes(studentStatus.currentTerm);
  const passInternshipRequirement = !requiresInternship || studentStatus.completedInternship;

  // กำหนดสถานะของแต่ละขั้นตอน
  const creditsStatus = passCredits ? "finish" : "error";
  const majorCreditsStatus = passMajorCredits ? "finish" : "error";
  const semesterStatus = isAllowedSemester ? "finish" : "error";
  const internshipStatus = passInternshipRequirement ? "finish" : "error";
  const overallStatus = canAccessProject ? "finish" : "error";

  // ตารางข้อมูลทั่วไปเกี่ยวกับโครงงานพิเศษ
  const generalInfo = [
    {
      key: '1',
      item: 'ระยะเวลาทำโครงงาน',
      requirement: '2 ภาคการศึกษา (โครงงานพิเศษ 1 และโครงงานพิเศษ 2)',
    },
    {
      key: '2',
      item: 'ช่วงเวลาลงทะเบียน',
      requirement: 'ภาคการศึกษาที่ 1 หรือ 2 (กรณีปกติ)',
    },
    {
      key: '3',
      item: 'เอกสารที่ต้องส่ง',
      requirement: 'แบบเสนอหัวข้อโครงงานพิเศษ, เอกสารข้อเสนอโครงงาน, บันทึก Logbook',
    },
    {
      key: '4',
      item: 'การประเมินผล',
      requirement: 'คะแนนรวมจากอาจารย์ที่ปรึกษาและกรรมการสอบ',
    }
  ];

  const columns = [
    {
      title: 'รายการ',
      dataIndex: 'item',
      key: 'item',
      width: '30%',
    },
    {
      title: 'ข้อกำหนด',
      dataIndex: 'requirement',
      key: 'requirement',
    }
  ];

  return (
    <div className="eligibility-container">
      <Card title="ตรวจสอบคุณสมบัติสำหรับโครงงานพิเศษ" bordered={false}>
        {isLoading || refreshing ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <p>กำลังตรวจสอบคุณสมบัติ...</p>
          </div>
        ) : (
          <>
            <Alert 
              message={canAccessProject 
                ? "คุณมีคุณสมบัติครบถ้วนสำหรับการทำโครงงานพิเศษ" 
                : "คุณยังมีคุณสมบัติไม่ครบถ้วนสำหรับการทำโครงงานพิเศษ"
              } 
              type={canAccessProject ? "success" : "warning"}
              description={messages?.project || "ระบบกำลังตรวจสอบคุณสมบัติของคุณ"}
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={8}>
                <Statistic 
                  title="จำนวนหน่วยกิตที่เรียนแล้ว" 
                  value={studentStatus.totalCredits} 
                  suffix={`/ ${requiredCredits}`}
                  valueStyle={{ color: passCredits ? '#3f8600' : '#cf1322' }}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic 
                  title="จำนวนหน่วยกิตสาขาที่เรียนแล้ว" 
                  value={studentStatus.majorCredits} 
                  suffix={`/ ${requiredMajorCredits}`}
                  valueStyle={{ color: passMajorCredits ? '#3f8600' : '#cf1322' }}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic 
                  title="ภาคเรียนปัจจุบัน" 
                  value={`${studentStatus.currentTerm}/${studentStatus.currentAcademicYear}`}
                  valueStyle={{ color: isAllowedSemester ? '#3f8600' : '#cf1322' }}
                  prefix={<ClockCircleOutlined />}
                />
                <Text type="secondary">ภาคเรียนที่อนุญาต: {allowedSemesters.join(', ')}</Text>
              </Col>
            </Row>

            {requiresInternship && (
              <Row style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <Alert
                    message="สถานะการฝึกงาน"
                    description={
                      studentStatus.completedInternship
                        ? "คุณผ่านการฝึกงานแล้ว"
                        : "คุณยังไม่ผ่านการฝึกงาน ซึ่งเป็นเงื่อนไขสำหรับการทำโครงงานพิเศษ"
                    }
                    type={studentStatus.completedInternship ? "success" : "error"}
                    showIcon
                  />
                </Col>
              </Row>
            )}

            <Divider orientation="left">เกณฑ์คุณสมบัติโครงงานพิเศษ</Divider>
            
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: 'จำนวนหน่วยกิตรวม',
                  description: `ต้องผ่านการเรียนมาแล้วอย่างน้อย ${requiredCredits} หน่วยกิต`,
                  status: creditsStatus,
                  icon: passCredits ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                },
                {
                  title: 'จำนวนหน่วยกิตในสาขา',
                  description: `ต้องผ่านการเรียนวิชาในสาขามาแล้วอย่างน้อย ${requiredMajorCredits} หน่วยกิต`,
                  status: majorCreditsStatus,
                  icon: passMajorCredits ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                },
                {
                  title: 'ภาคเรียนที่อนุญาต',
                  description: `ต้องอยู่ในภาคเรียนที่กำหนดไว้สำหรับการทำโครงงานพิเศษ (ภาคเรียนที่ ${allowedSemesters.join(', ')})`,
                  status: semesterStatus,
                  icon: isAllowedSemester ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                },
                ...(requiresInternship ? [{
                  title: 'ผ่านการฝึกงานภาคอุตสาหกรรม',
                  description: 'ต้องผ่านวิชาฝึกงานภาคอุตสาหกรรมก่อนลงทะเบียนโครงงานพิเศษ',
                  status: internshipStatus,
                  icon: passInternshipRequirement ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                }] : []),
                {
                  title: 'สถานะสิทธิ์โครงงานพิเศษโดยรวม',
                  description: canAccessProject 
                    ? 'คุณมีคุณสมบัติครบถ้วนสำหรับการทำโครงงานพิเศษ' 
                    : 'คุณยังมีคุณสมบัติไม่ครบถ้วน โปรดตรวจสอบเกณฑ์ข้างต้น',
                  status: overallStatus,
                  icon: canAccessProject ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                }
              ]}
            />

            {!canAccessProject && (
              <Alert
                message="คำแนะนำ"
                description={(
                  <>
                    <Paragraph>
                      คุณยังไม่มีสิทธิ์ในการลงทะเบียนโครงงานพิเศษ เนื่องจากคุณสมบัติยังไม่ครบถ้วน กรุณาตรวจสอบเรื่องที่ต้องดำเนินการดังนี้:
                    </Paragraph>
                    <ul>
                      {!passCredits && (
                        <li>
                          <Text strong>เพิ่มจำนวนหน่วยกิตรวม:</Text> ลงทะเบียนเรียนเพิ่มให้ครบอย่างน้อย {requiredCredits} หน่วยกิต 
                          (ขาดอีก {requiredCredits - studentStatus.totalCredits} หน่วยกิต)
                        </li>
                      )}
                      {!passMajorCredits && (
                        <li>
                          <Text strong>เพิ่มจำนวนหน่วยกิตสาขา:</Text> ลงทะเบียนรายวิชาในสาขาเพิ่มให้ครบอย่างน้อย {requiredMajorCredits} หน่วยกิต 
                          (ขาดอีก {requiredMajorCredits - studentStatus.majorCredits} หน่วยกิต)
                        </li>
                      )}
                      {!isAllowedSemester && (
                        <li>
                          <Text strong>รอจนถึงภาคเรียนที่กำหนด:</Text> สามารถลงทะเบียนโครงงานพิเศษได้เฉพาะในภาคเรียนที่ {allowedSemesters.join(', ')} เท่านั้น
                        </li>
                      )}
                      {requiresInternship && !studentStatus.completedInternship && (
                        <li>
                          <Text strong>ต้องผ่านการฝึกงาน:</Text> ตามหลักสูตรกำหนดให้นักศึกษาต้องผ่านการฝึกงานภาคอุตสาหกรรมก่อนลงทะเบียนโครงงานพิเศษ
                        </li>
                      )}
                    </ul>
                  </>
                )}
                type="info"
                showIcon
                style={{ marginBottom: 24, marginTop: 24 }}
              />
            )}

            <Divider orientation="left">ข้อมูลทั่วไปเกี่ยวกับโครงงานพิเศษ</Divider>
            <Table 
              dataSource={generalInfo} 
              columns={columns}
              pagination={false}
              style={{ marginBottom: 24 }}
            />

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button 
                type="primary" 
                onClick={handleRefresh} 
                loading={refreshing}
                icon={<InfoCircleOutlined />}
              >
                ตรวจสอบคุณสมบัติอีกครั้ง
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ProjectEligibilityCheck;