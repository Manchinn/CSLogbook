import React, { useState, useEffect } from 'react';
import { Card, Timeline, Tag, Button, Alert, Typography, Row, Col } from 'antd';
import internshipService from '../../../services/internshipService';
import { workflowService } from '../../../services/workflowService';

const { Title, Text } = Typography;

const InternshipSection = ({ student }) => {
  const [cs05Status, setCs05Status] = useState(null);
  const [internshipDate, setInternshipDate] = useState({ startDate: null, endDate: null });
  const [summaryStatus, setSummaryStatus] = useState(null);
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryCompleted, setSummaryCompleted] = useState(null);

  // โหลดสถานะ CS05
  useEffect(() => {
    const fetchCS05 = async () => {
      setLoading(true);
      try {
        const res = await internshipService.getCurrentCS05();
        if (res.success && res.data) {
          setCs05Status(res.data.status);
          setInternshipDate({
            startDate: res.data.startDate,
            endDate: res.data.endDate,
          });
        } else {
          setCs05Status(null);
        }
      } catch {
        setCs05Status(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCS05();
  }, [student?.studentId]);

  // โหลดสถานะสรุปผลการฝึกงาน
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await internshipService.getInternshipSummary();
        if (res.success && res.data) {
          setSummaryStatus(res.data.status); // สมมติ backend ส่ง status เช่น 'completed', 'pending'
        } else {
          setSummaryStatus(null);
        }
      } catch {
        setSummaryStatus(null);
      }
    };
    fetchSummary();
  }, []);

  // โหลดสถานะหนังสือรับรอง
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await internshipService.getCertificateStatus();
        if (res.success && res.data) {
          setSummaryCompleted(res.data.requirements.summarySubmission.completed);
          setCertificateStatus(res.data.status); // เช่น 'ready', 'requested', 'completed'
        } else {
          setSummaryCompleted(null);
          setCertificateStatus(null);
        }
      } catch {
        setSummaryCompleted(null);
        setCertificateStatus(null);
      }
    };
    fetchCertificate();
  }, []);

  // ฟังก์ชันช่วยแปลงสถานะเป็นข้อความและสี
  const getStepStatus = (stepKey) => {
    switch (stepKey) {
      case 'eligibility':
        // สมมติว่ามีฟิลด์ eligibility ใน student
        return student?.eligibility?.internship?.eligible ? 'finish' : 'process';
      case 'cs05':
        if (!cs05Status) return 'wait';
        if (cs05Status === 'approved' || cs05Status === 'supervisor_approved' || cs05Status === 'supervisor_evaluated') return 'finish';
        return 'process';
      case 'wait_start':
        if (!internshipDate.startDate) return 'wait';
        const now = new Date();
        const start = new Date(internshipDate.startDate);
        if (now < start) return 'process';
        return 'finish';
      case 'in_progress':
        if (!internshipDate.startDate) return 'wait';
        const now2 = new Date();
        const start2 = new Date(internshipDate.startDate);
        const end2 = new Date(internshipDate.endDate);
        if (now2 >= start2 && now2 <= end2) return 'process';
        if (now2 > end2) return 'finish';
        return 'wait';
      case 'summary':
        if (summaryCompleted === true) return 'finish';
        if (summaryCompleted === false) return 'process';
        return 'wait';
      case 'certificate':
        if (certificateStatus === 'ready') return 'finish';
        if (certificateStatus === 'pending') return 'process';
        return 'wait';
      case 'done':
        if (certificateStatus === 'ready') return 'finish';
        return 'wait';
      default:
        return 'wait';
    }
  };

  // กำหนดขั้นตอนหลักของ timeline
  const steps = [
    {
      key: 'eligibility',
      title: 'ตรวจสอบสิทธิ์การฝึกงาน',
      description: student?.eligibility?.internship?.eligible
        ? 'คุณมีคุณสมบัติครบถ้วนสำหรับการฝึกงาน'
        : 'คุณยังไม่มีสิทธิ์ฝึกงาน กรุณาตรวจสอบเกณฑ์',
    },
    {
      key: 'cs05',
      title: 'ลงทะเบียนคำร้องฝึกงาน (คพ.05)',
      description: !cs05Status
        ? 'ยังไม่ได้ลงทะเบียน'
        : 'ลงทะเบียนและอนุมัติแล้ว',
      action: !cs05Status && (
        <Button type="primary" href="/internship-registration" style={{ marginTop: 8 }}>
          ไปลงทะเบียนฝึกงาน
        </Button>
      ),
    },
    {
      key: 'wait_start',
      title: 'รอเริ่มการฝึกงาน',
      description: internshipDate.startDate
        ? `รอถึงวันเริ่มฝึกงาน (${new Date(internshipDate.startDate).toLocaleDateString()})`
        : 'ยังไม่มีข้อมูลวันเริ่มฝึกงาน',
    },
    {
      key: 'in_progress',
      title: 'อยู่ระหว่างการฝึกงาน',
      description: internshipDate.startDate && internshipDate.endDate
        ? `ช่วงฝึกงาน: ${new Date(internshipDate.startDate).toLocaleDateString()} - ${new Date(internshipDate.endDate).toLocaleDateString()}`
        : 'ยังไม่มีข้อมูลช่วงฝึกงาน',
    },
    {
      key: 'summary',
      title: 'รอส่งเอกสารสรุปผลการฝึกงาน',
      description: summaryCompleted
        ? 'ส่งเอกสารสรุปผลเรียบร้อยแล้ว'
        : 'กรุณาส่งเอกสารสรุปผลการฝึกงาน',
      action: !summaryCompleted && (
        <Button type="primary" href="/internship/summary" style={{ marginTop: 8 }}>
          ส่งเอกสารสรุปผล
        </Button>
      ),
    },
    {
      key: 'certificate',
      title: 'ขอหนังสือรับรองการฝึกงาน',
      description: certificateStatus === 'ready'
        ? 'ได้รับหนังสือรับรองแล้ว'
        : certificateStatus === 'pending'
          ? 'รอเจ้าหน้าที่อนุมัติหนังสือรับรอง'
          : 'สามารถขอหนังสือรับรองการฝึกงานได้',
      action: certificateStatus !== 'ready' && (
        <Button type="primary" href="/internship-certificate" style={{ marginTop: 8 }}>
          ขอหนังสือรับรอง
        </Button>
      ),
    },
    {
      key: 'done',
      title: 'เสร็จสิ้นการฝึกงาน',
      description: certificateStatus === 'ready'
        ? 'กระบวนการฝึกงานของคุณเสร็จสมบูรณ์แล้ว'
        : 'รอรับหนังสือรับรองการฝึกงาน',
    },
  ];

  // ฟังก์ชันแปลงสถานะเป็นสี
  const getColor = (status) => {
    switch (status) {
      case 'finish': return 'green';
      case 'process': return 'blue';
      default: return 'gray';
    }
  };

  // ฟังก์ชันแปลงสถานะเป็นข้อความ
  const getStatusText = (status) => {
    switch (status) {
      case 'finish': return 'เสร็จสิ้น';
      case 'process': return 'กำลังดำเนินการ';
      default: return 'รอดำเนินการ';
    }
  };

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Timeline การฝึกงาน</Title>}
      loading={loading}
      style={{ marginBottom: 24 }}
      bodyStyle={{ padding: 24 }}
    >
      <Row justify="center">
        <Col xs={24} md={20} lg={16}>
          <Timeline style={{ marginTop: 8, marginBottom: 8 }} mode="left">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.key);
              return (
                <Timeline.Item
                  key={step.key}
                  color={getColor(status)}
                  dot={
                    <Tag color={getColor(status)}>{getStatusText(status)}</Tag>
                  }
                  style={{ paddingBottom: 24 }}
                >
                  <Text strong style={{ fontSize: 16 }}>{step.title}</Text>
                  <div style={{ margin: '4px 0 8px 0', color: '#555' }}>{step.description}</div>
                  {step.action}
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Col>
      </Row>
    </Card>
  );
};

export default InternshipSection;