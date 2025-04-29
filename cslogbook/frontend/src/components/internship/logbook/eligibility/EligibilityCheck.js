import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, List, Steps, Alert, Spin, Button, Row, Col, Statistic, Table } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined, 
  LoadingOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  BookOutlined 
} from '@ant-design/icons';
import { useStudentEligibility } from '../../../../contexts/StudentEligibilityContext';
import './styles.css';

const { Title, Paragraph, Text } = Typography;

const EligibilityCheck = () => {
  const { 
    canAccessInternship,
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

  // คุณสมบัติที่จำเป็นสำหรับฝึกงาน
  const requiredCredits = requirements?.internship?.totalCredits || 81;
  const requiredMajorCredits = requirements?.internship?.majorCredits || 0;
  const allowedSemesters = requirements?.internship?.allowedSemesters || [3];
  
  // สถานะปัจจุบันของนักศึกษา
  const studentStatus = {
    totalCredits: requirements?.status?.internship?.totalCredits || 0,
    majorCredits: requirements?.status?.internship?.currentMajorCredits || 0,
    currentTerm: academicSettings?.currentSemester || 1,
    currentAcademicYear: academicSettings?.currentAcademicYear || new Date().getFullYear() + 543
  };

  // คำนวณว่าผ่านเกณฑ์หรือไม่
  const passCredits = studentStatus.totalCredits >= requiredCredits;
  const passMajorCredits = studentStatus.majorCredits >= requiredMajorCredits;
  const isAllowedSemester = allowedSemesters.includes(studentStatus.currentTerm);

  // กำหนดสถานะของแต่ละขั้นตอน
  const creditsStatus = passCredits ? "finish" : "error";
  const majorCreditsStatus = passMajorCredits ? "finish" : "error";
  const semesterStatus = isAllowedSemester ? "finish" : "error";
  const overallStatus = canAccessInternship ? "finish" : "error";

  // ตารางข้อมูลทั่วไปเกี่ยวกับการฝึกงาน
  const generalInfo = [
    {
      key: '1',
      item: 'ระยะเวลาฝึกงาน',
      requirement: 'อย่างน้อย 240 ชั่วโมง (ประมาณ 6-8 สัปดาห์)',
    },
    {
      key: '2',
      item: 'ช่วงเวลาฝึกงาน',
      requirement: 'ภาคฤดูร้อน (ปกติช่วงเดือนพฤษภาคม - กรกฎาคม)',
    },
    {
      key: '3',
      item: 'เอกสารที่ต้องยื่น',
      requirement: 'คพ.05 - แบบคำร้องขอฝึกงาน',
    },
    {
      key: '4',
      item: 'การประเมินผล',
      requirement: 'S - ผ่าน หรือ U - ไม่ผ่าน',
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
      <Card title="ตรวจสอบคุณสมบัติสำหรับการฝึกงาน" bordered={false}>
        {isLoading || refreshing ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <p>กำลังตรวจสอบคุณสมบัติ...</p>
          </div>
        ) : (
          <>
            <Alert 
              message={canAccessInternship 
                ? "คุณมีคุณสมบัติครบถ้วนสำหรับการฝึกงาน" 
                : "คุณยังมีคุณสมบัติไม่ครบถ้วนสำหรับการฝึกงาน"
              } 
              type={canAccessInternship ? "success" : "warning"}
              description={messages?.internship || "ระบบกำลังตรวจสอบคุณสมบัติของคุณ"}
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic 
                  title="จำนวนหน่วยกิตที่เรียนแล้ว" 
                  value={studentStatus.totalCredits} 
                  suffix={`/ ${requiredCredits}`}
                  valueStyle={{ color: passCredits ? '#3f8600' : '#cf1322' }}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="จำนวนหน่วยกิตสาขาที่เรียนแล้ว" 
                  value={studentStatus.majorCredits} 
                  suffix={`/ ${requiredMajorCredits}`}
                  valueStyle={{ color: passMajorCredits ? '#3f8600' : '#cf1322' }}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="ภาคเรียนปัจจุบัน" 
                  value={`${studentStatus.currentTerm}/${studentStatus.currentAcademicYear}`}
                  valueStyle={{ color: isAllowedSemester ? '#3f8600' : '#cf1322' }}
                  prefix={<ClockCircleOutlined />}
                />
                <Text type="secondary">ภาคเรียนที่อนุญาตให้ฝึกงาน: {allowedSemesters.join(', ')}</Text>
              </Col>
            </Row>

            <Divider orientation="left">เกณฑ์คุณสมบัติการฝึกงาน</Divider>
            
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
                  description: `ต้องอยู่ในภาคเรียนที่กำหนดไว้สำหรับการฝึกงาน (ภาคเรียนที่ ${allowedSemesters.join(', ')})`,
                  status: semesterStatus,
                  icon: isAllowedSemester ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                },
                {
                  title: 'สถานะสิทธิ์ฝึกงานโดยรวม',
                  description: canAccessInternship 
                    ? 'คุณมีคุณสมบัติครบถ้วนสำหรับการฝึกงาน' 
                    : 'คุณยังมีคุณสมบัติไม่ครบถ้วน โปรดตรวจสอบเกณฑ์ข้างต้น',
                  status: overallStatus,
                  icon: canAccessInternship ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                }
              ]}
            />

            {!canAccessInternship && (
              <Alert
                message="คำแนะนำ"
                description={(
                  <>
                    <Paragraph>
                      คุณยังไม่มีสิทธิ์ในการฝึกงาน เนื่องจากคุณสมบัติยังไม่ครบถ้วน กรุณาตรวจสอบเรื่องที่ต้องดำเนินการดังนี้:
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
                          <Text strong>รอจนถึงภาคเรียนที่กำหนด:</Text> สามารถฝึกงานได้เฉพาะภาคเรียนที่ {allowedSemesters.join(', ')} เท่านั้น
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

            <Divider orientation="left">ข้อมูลทั่วไปเกี่ยวกับการฝึกงาน</Divider>
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

export default EligibilityCheck;