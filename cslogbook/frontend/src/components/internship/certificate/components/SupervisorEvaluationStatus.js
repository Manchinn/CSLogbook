import React from 'react';
import { Card, Timeline, Tag, Alert, Typography, Space, Statistic, Row, Col } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// เพิ่มความสามารถแสดงคะแนนการประเมิน (ถ้ามี) หรือแสดงเพียงสถานะผ่าน/รอ
// Props ใหม่:
// - evaluationScore: (number) คะแนนรวมที่คำนวณแล้ว (0-100)
// - passScore: (number) เกณฑ์ผ่าน (ค่าเริ่มต้น 60)
// - showScore: (boolean) บังคับให้แสดงเป็นคะแนน (ถ้ามีคะแนน)
// - hideStatusText: (boolean) ซ่อนข้อความรายละเอียดใต้คะแนน
const SupervisorEvaluationStatus = ({
  status,
  totalHours, // ชั่วโมงรวมทั้งหมด (raw จาก certificate status หรือ summary)
  // หมายเหตุ: totalApprovedHours ในหน้า Summary.js ถูกคำนวณจาก useSummaryData โดย
  //   1) แปลง entries -> ให้สถานะ approved/pending/rejected
  //   2) filter เฉพาะ entry ที่ status === 'approved'
  //   3) reduce รวม hours แล้วปัดทศนิยม (ดู useSummaryData: setTotalApprovedHours)
  // เราเพิ่ม prop totalApprovedHours เพื่อส่งค่าที่คำนวณแล้วมาใช้ตรง ๆ ถ้ามี
  totalApprovedHours = null, // 🆕 ชั่วโมงที่ "อนุมัติแล้ว" (ตรงจาก summary ถ้ามี)
  approvedHours = null,      // 🆕 alias เก่า (ยังรองรับเพื่อ backward compatibility)
  entries = null,            // 🆕 รายการบันทึก (fallback คำนวณได้เองถ้าไม่ส่งค่าอื่นมา)
  evaluationScore = null,    // คะแนนรวม (อาจยังไม่ได้ส่งมา)
  passScore = 70,
  showScore = true,
  hideStatusText = false,
  requiredHours = 240,       // 🆕 ทำเป็นตัวแปร configurable (ค่าเริ่มต้น 240)
}) => {
  const getStatusColor = (condition) => {
    return condition ? 'success' : 'default';
  };

  const getStatusIcon = (condition) => {
    return condition ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
  };

  // 🧮 ลำดับ fallback การคำนวณชั่วโมงที่ "อนุมัติแล้ว"
  // 1) approvedHours (prop เดิม)
  // 2) totalApprovedHours (prop ใหม่ สะท้อน logic ในหน้า Summary)
  // 3) entries (คำนวณสด: นับเฉพาะ supervisorApproved/supervisor_approved)
  // 4) totalHours (สุดท้ายอาจเป็นชั่วโมงดิบหากไม่มีข้อมูลอื่น)
  let approvedHoursComputed =
    approvedHours != null
      ? approvedHours
      : totalApprovedHours != null
        ? totalApprovedHours
        : null;

  if (approvedHoursComputed == null && Array.isArray(entries)) {
    approvedHoursComputed = entries.reduce((sum, e) => {
      const isApproved =
        e.supervisorApproved === 1 ||
        e.supervisorApproved === true ||
        e.supervisor_approved === 1 ||
        e.supervisor_approved === true ||
        e.status === 'approved';
      if (isApproved) {
        const h = parseFloat(
          e.approvedHours || e.totalHours || e.workHours || e.hours || 0
        );
        return sum + (isNaN(h) ? 0 : h);
      }
      return sum;
    }, 0);
  }
  if (approvedHoursComputed == null) approvedHoursComputed = totalHours || 0; // final fallback

  const isHoursComplete = approvedHoursComputed >= requiredHours;
  const hasScore = typeof evaluationScore === 'number' && evaluationScore >= 0;
  const isEvaluationPassed = hasScore
    ? evaluationScore >= passScore
    : status === 'completed'; // fallback เดิม
  // เกณฑ์สำเร็จ: ชั่วโมงครบ + ประเมินผ่าน (ไม่สน summary แล้ว)
  const allRequirementsMet = isHoursComplete && isEvaluationPassed;

  return (
    <Card style={{ marginBottom: 24 }}>
      <Title level={4}>🎯 สถานะการประเมินและข้อกำหนด</Title>

      {/* สถิติโดยรวม */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
    <Col xs={24} sm={8}>
          <Statistic
      title="ชั่วโมงที่อนุมัติแล้ว"
      value={approvedHoursComputed}
      suffix={`/ ${requiredHours} ชั่วโมง`}
            prefix={getStatusIcon(isHoursComplete)}
            valueStyle={{ color: isHoursComplete ? '#3f8600' : '#cf1322' }}
          />
        </Col>
        <Col xs={24} sm={8}>
          {showScore && hasScore ? (
            <Statistic
              title={`คะแนนการประเมิน (ผ่าน ${passScore})`}
              value={evaluationScore}
              suffix={`/ ${100}`}
              prefix={getStatusIcon(isEvaluationPassed)}
              valueStyle={{ color: isEvaluationPassed ? '#3f8600' : '#cf1322' }}
            />
          ) : (
            <Statistic
              title="การประเมินผู้ควบคุมงาน"
              value={isEvaluationPassed ? 'ผ่านเกณฑ์' : 'รอดำเนินการ'}
              prefix={getStatusIcon(isEvaluationPassed)}
              valueStyle={{ color: isEvaluationPassed ? '#3f8600' : '#cf1322' }}
            />
          )}
        </Col>
  {/* ตัดคอลัมน์รายงานสรุปผลออก */}
      </Row>

      {/* Timeline รายละเอียด */}
      <Timeline
        items={[
          {
            color: getStatusColor(isHoursComplete),
            dot: getStatusIcon(isHoursComplete),
            children: (
              <Space direction="vertical">
                <Text strong>
                  ชั่วโมงฝึกงานครบถ้วน ({requiredHours} ชั่วโมง)
                </Text>
                <Tag color={isHoursComplete ? 'success' : 'warning'}>
                  อนุมัติแล้ว: {approvedHoursComputed} ชั่วโมง
                </Tag>
                {approvedHoursComputed !== totalHours && totalHours != null && (
                  <Text type="secondary">รวม (บันทึกทั้งหมด): {totalHours} ชั่วโมง</Text>
                )}
                {!isHoursComplete && (
                  <Text type="secondary">
                    ยังขาดอีก {Math.max(0, requiredHours - approvedHoursComputed)} ชั่วโมง
                  </Text>
                )}
              </Space>
            )
          },
          {
            color: getStatusColor(isEvaluationPassed),
            dot: getStatusIcon(isEvaluationPassed),
            children: (
              <Space direction="vertical">
                <Text strong>การประเมินผลจากผู้ควบคุมงาน</Text>
                {showScore && hasScore ? (
                  <Tag color={isEvaluationPassed ? 'success' : 'error'}>
                    คะแนน {evaluationScore}/{100} {isEvaluationPassed ? '(ผ่าน)' : '(ไม่ผ่าน)'}
                  </Tag>
                ) : (
                  <Tag color={isEvaluationPassed ? 'success' : 'processing'}>
                    {isEvaluationPassed ? 'ประเมินแล้ว / ผ่านเกณฑ์' : 'รอการประเมิน'}
                  </Tag>
                )}
                {!hideStatusText && !isEvaluationPassed && (
                  <Text type="secondary">
                    {hasScore
                      ? `ยังขาด ${passScore - evaluationScore} คะแนนถึงจะผ่าน`
                      : 'กรุณาติดต่อผู้ควบคุมงานเพื่อทำการประเมินในระบบ'}
                  </Text>
                )}
              </Space>
            )
          }
        ]}
      />

  {/* ตัด timeline รายงานสรุปผลออก */}

      {/* แสดง Alert ตามสถานะ */}
      {allRequirementsMet ? (
        <Alert
          message="พร้อมขอหนังสือรับรองการฝึกงาน!"
          description="คุณผ่านเงื่อนไขทั้งหมดแล้ว สามารถส่งคำขอหนังสือรับรองได้"
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      ) : (
        <Alert
          message="ยังไม่พร้อมขอหนังสือรับรอง"
          description="กรุณาดำเนินการให้ครบถ้วนตามเงื่อนไขข้างต้นก่อนส่งคำขอ"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      )}
    </Card>
  );
};

export default SupervisorEvaluationStatus;