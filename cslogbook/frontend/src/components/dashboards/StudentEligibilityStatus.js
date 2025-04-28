import React from 'react';
import { Card, Row, Col, Statistic, Button, Divider, Alert, Tag, Typography, Tooltip, Spin, Popover } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  InfoCircleOutlined, 
  ReloadOutlined,
  RightOutlined,
  WarningOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './Dashboard.css';

const { Text, Title, Paragraph } = Typography;

/**
 * Component แสดงสถานะสิทธิ์การลงทะเบียนฝึกงานและโครงงานพิเศษของนักศึกษา
 * ใช้ข้อมูลจาก useStudentPermissions hook
 */
const StudentEligibilityStatus = ({ 
  canAccessInternship, 
  canAccessProject,
  internshipReason,
  projectReason,
  requirements,
  academicSettings,
  isLoading,
  refreshPermissions
}) => {
  const navigate = useNavigate();
  
  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  // สร้าง tag แสดงสถานะการลงทะเบียน
  const getRegistrationStatusTag = (isOpen) => {
    if (isOpen) {
      return <Tag color="green">เปิดลงทะเบียน</Tag>;
    }
    return <Tag color="red">ปิดลงทะเบียน</Tag>;
  };

  // สร้างข้อความอธิบายเหตุผลที่ไม่มีสิทธิ์แบบละเอียด
  const renderDetailedReason = (reason) => {
    if (!reason) return null;
    
    // ตรวจสอบประเภทของเหตุผล
    if (reason.includes("หน่วยกิต")) {
      return (
        <>
          <Paragraph>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            <Text strong>หน่วยกิตไม่เพียงพอ</Text>
          </Paragraph>
          <Paragraph>
            {reason}
          </Paragraph>
          <Paragraph type="secondary">
            คุณจำเป็นต้องลงทะเบียนเรียนเพิ่มเติมเพื่อให้มีหน่วยกิตครบตามเกณฑ์ที่กำหนด
            กรุณาติดต่ออาจารย์ที่ปรึกษาเพื่อวางแผนการลงทะเบียน
          </Paragraph>
        </>
      );
    } 
    else if (reason.includes("ภาคเรียน")) {
      return (
        <>
          <Paragraph>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            <Text strong>ไม่อยู่ในภาคเรียนที่กำหนด</Text>
          </Paragraph>
          <Paragraph>
            {reason}
          </Paragraph>
          <Paragraph type="secondary">
            ตามระเบียบของภาควิชา คุณสามารถลงทะเบียนฝึกงานได้ในภาคเรียนที่กำหนดเท่านั้น
            กรุณารอจนกว่าจะถึงภาคเรียนที่สามารถลงทะเบียนได้
          </Paragraph>
        </>
      );
    }
    else if (reason.includes("ช่วงเวลา")) {
      return (
        <>
          <Paragraph>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            <Text strong>อยู่นอกช่วงเวลาลงทะเบียน</Text>
          </Paragraph>
          <Paragraph>
            {reason}
          </Paragraph>
          <Paragraph type="secondary">
            ระบบจะเปิดให้ลงทะเบียนในช่วงเวลาที่กำหนดเท่านั้น
            กรุณาตรวจสอบกำหนดการและเตรียมเอกสารให้พร้อม
          </Paragraph>
        </>
      );
    }
    else if (reason.includes("สถานะ")) {
      return (
        <>
          <Paragraph>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            <Text strong>สถานภาพนักศึกษาไม่เข้าเกณฑ์</Text>
          </Paragraph>
          <Paragraph>
            {reason}
          </Paragraph>
          <Paragraph type="secondary">
            กรุณาติดต่อภาควิชาเพื่อตรวจสอบสถานภาพนักศึกษาของคุณ
          </Paragraph>
        </>
      );
    }
    else {
      return (
        <>
          <Paragraph>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            <Text strong>ไม่ผ่านเกณฑ์การลงทะเบียน</Text>
          </Paragraph>
          <Paragraph>{reason}</Paragraph>
        </>
      );
    }
  };

  // แสดง loading state
  if (isLoading) {
    return (
      <Card title="สิทธิ์การลงทะเบียน" className="eligibility-card">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
          <div style={{ marginTop: '10px' }}>กำลังตรวจสอบสิทธิ์...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>สิทธิ์การลงทะเบียน</span>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={refreshPermissions}
            size="small"
          />
        </div>
      } 
      className="eligibility-card"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Statistic
            title="สิทธิ์การฝึกงาน"
            value={canAccessInternship ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์"}
            valueStyle={{ 
              color: canAccessInternship ? '#52c41a' : '#faad14',
              fontSize: '18px'
            }}
            prefix={canAccessInternship ? 
              <CheckCircleOutlined style={{ fontSize: '20px' }} /> : 
              <ClockCircleOutlined style={{ fontSize: '20px' }} />
            }
          />

          {/* แสดงเหตุผลที่ไม่มีสิทธิ์แบบชัดเจนและมีรายละเอียดมากขึ้น */}
          {internshipReason && !canAccessInternship && (
            <>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: '5px' }} />
                สาเหตุ: {internshipReason}
              </Text>
              <Popover 
                content={renderDetailedReason(internshipReason)}
                title="รายละเอียดสิทธิ์การฝึกงาน"
                trigger="click"
                placement="bottomLeft"
                overlayStyle={{ maxWidth: '300px' }}
              >
                <Button type="link" size="small" style={{ padding: '0', height: 'auto', fontSize: '12px', marginTop: '4px' }}>
                  คลิกเพื่อดูรายละเอียดเพิ่มเติม
                </Button>
              </Popover>
            </>
          )}
          
          {academicSettings?.internshipRegistrationPeriod && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <div>ช่วงลงทะเบียน: {formatDate(academicSettings.internshipRegistrationPeriod.startDate)} - {formatDate(academicSettings.internshipRegistrationPeriod.endDate)}</div>
              <div>สถานะ: {getRegistrationStatusTag(academicSettings.internshipRegistrationPeriod.isOpen)}</div>
            </div>
          )}
          
          {canAccessInternship && academicSettings?.internshipRegistrationPeriod?.isOpen && (
            <Button 
              size="small" 
              type="primary" 
              style={{ marginTop: '12px' }}
              onClick={() => navigate("/internship-registration/cs05")}
            >
              ลงทะเบียนฝึกงาน <RightOutlined />
            </Button>
          )}
        </Col>
        
        <Col xs={24} sm={12}>
          <Statistic
            title="สิทธิ์โครงงานพิเศษ"
            value={canAccessProject ? "มีสิทธิ์" : "ยังไม่มีสิทธิ์"}
            valueStyle={{ 
              color: canAccessProject ? '#52c41a' : '#faad14',
              fontSize: '18px'
            }}
            prefix={canAccessProject ? 
              <CheckCircleOutlined style={{ fontSize: '20px' }} /> : 
              <ClockCircleOutlined style={{ fontSize: '20px' }} />
            }
          />
          
          {/* แสดงเหตุผลที่ไม่มีสิทธิ์แบบชัดเจนและมีรายละเอียดมากขึ้น */}
          {projectReason && !canAccessProject && (
            <>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: '5px' }} />
                สาเหตุ: {projectReason}
              </Text>
              <Popover 
                content={renderDetailedReason(projectReason)}
                title="รายละเอียดสิทธิ์โครงงานพิเศษ"
                trigger="click"
                placement="bottomLeft"
                overlayStyle={{ maxWidth: '300px' }}
              >
                <Button type="link" size="small" style={{ padding: '0', height: 'auto', fontSize: '12px', marginTop: '4px' }}>
                  คลิกเพื่อดูรายละเอียดเพิ่มเติม
                </Button>
              </Popover>
            </>
          )}
          
          {academicSettings?.projectRegistrationPeriod && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <div>ช่วงลงทะเบียน: {formatDate(academicSettings.projectRegistrationPeriod.startDate)} - {formatDate(academicSettings.projectRegistrationPeriod.endDate)}</div>
              <div>สถานะ: {getRegistrationStatusTag(academicSettings.projectRegistrationPeriod.isOpen)}</div>
            </div>
          )}
          
          {canAccessProject && academicSettings?.projectRegistrationPeriod?.isOpen && (
            <Button 
              size="small" 
              type="primary" 
              style={{ marginTop: '12px' }}
              onClick={() => navigate("/project-proposal")}
            >
              ลงทะเบียนโครงงาน <RightOutlined />
            </Button>
          )}
        </Col>
      </Row>
      
      {requirements && (
        <div style={{ marginTop: '16px' }}>
          <Divider orientation="left" plain style={{ fontSize: '14px', margin: '12px 0' }}>
            เกณฑ์การลงทะเบียน
          </Divider>
          
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Tooltip 
                title={
                  <div>
                    <div>ต้องการหน่วยกิตรวม {requirements.internship.totalCredits} หน่วย</div>
                    <div>หน่วยกิตภาควิชา {requirements.internship.majorCredits} หน่วย</div>
                    {requirements.internship.allowedSemesters && (
                      <div>ภาคเรียนที่ลงทะเบียนได้: {requirements.internship.allowedSemesters.join(', ')}</div>
                    )}
                  </div>
                }
              >
                <div className="eligibility-requirement">
                  <InfoCircleOutlined /> เกณฑ์ฝึกงาน <InfoCircleOutlined />
                </div>
              </Tooltip>
            </Col>
            
            <Col span={12}>
              <Tooltip 
                title={
                  <div>
                    <div>ต้องการหน่วยกิตรวม {requirements.project.totalCredits} หน่วย</div>
                    <div>หน่วยกิตภาควิชา {requirements.project.majorCredits} หน่วย</div>
                    {requirements.project.requireInternship && (
                      <div>ต้องผ่านการฝึกงานก่อน</div>
                    )}
                    {requirements.project.allowedSemesters && (
                      <div>ภาคเรียนที่ลงทะเบียนได้: {requirements.project.allowedSemesters.join(', ')}</div>
                    )}
                  </div>
                }
              >
                <div className="eligibility-requirement">
                  <InfoCircleOutlined /> เกณฑ์โครงงาน <InfoCircleOutlined />
                </div>
              </Tooltip>
            </Col>
          </Row>
        </div>
      )}
      
      <Alert
        message="หากคุณคิดว่าข้อมูลไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่"
        type="info"
        showIcon
        style={{ marginTop: '16px', marginBottom: '0' }}
      />
    </Card>
  );
};

export default StudentEligibilityStatus;