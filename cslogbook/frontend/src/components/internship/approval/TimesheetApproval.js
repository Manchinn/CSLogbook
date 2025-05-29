import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Button,
  Card,
  Typography,
  Divider,
  Alert,
  Spin,
  message,
  Row,
  Col,
  Table,
  Tag,
  Input,
  Radio,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined, // เพิ่มไอคอนสำหรับ Error
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import moment from "moment";
import styles from "./TimesheetApproval.module.css"; // นำเข้า CSS Module

const { Title, Text } = Typography;
const { TextArea } = Input;

const TimesheetApproval = () => {
  const { token } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [approvalDetails, setApprovalDetails] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [decision, setDecision] = useState(null);

  const fetchApprovalData = useCallback(async () => {
    if (!token) {
      setError("ไม่พบ Token สำหรับการอนุมัติ หรือ Token ไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/email-approval/details/${token}`);
      const data = await response.json();
      if (data.success && data.data) {
        setApprovalDetails(data.data);
        if (data.data.status !== "pending") {
          setSubmitted(true);
          // เพิ่ม message แจ้งเตือนว่า token ถูกใช้งานแล้ว
          if (data.data.status === 'approved') {
            message.info('การอนุมัตินี้ได้รับการอนุมัติไปแล้ว');
          } else if (data.data.status === 'rejected') {
            message.info('การอนุมัตินี้ได้รับการปฏิเสธไปแล้ว');
          }
        }
      } else {
        setError(data.message || "ไม่สามารถดึงข้อมูลการอนุมัติได้");
      }
    } catch (err) {
      console.error("Error fetching approval data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApprovalData();
  }, [token, fetchApprovalData]);

  const handleSubmit = async (values) => {
    if (!decision) {
      message.error("กรุณาเลือกการดำเนินการ (อนุมัติ หรือ ไม่อนุมัติ)");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const endpoint =
        decision === "approve"
          ? `/api/email-approval/approve/${token}`
          : `/api/email-approval/reject/${token}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: values.comment || "" }),
      });
      const result = await response.json();
      if (result.success) {
        message.success(
          decision === "approve"
            ? "อนุมัติบันทึกการฝึกงานเรียบร้อยแล้ว"
            : "ปฏิเสธบันทึกการฝึกงานเรียบร้อยแล้ว"
        );
        setSubmitted(true);
        setApprovalDetails(prev => ({...prev, status: decision === 'approve' ? 'approved' : 'rejected'})); // อัปเดต status ใน state
        form.resetFields();
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการดำเนินการ");
        message.error(result.message || "เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (err) {
      console.error("Error submitting approval:", err);
      const errorMessage = "เกิดข้อผิดพลาดในการส่งข้อมูล";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "วันที่",
      dataIndex: "workDate",
      key: "workDate",
      render: (date) => moment(date).add(543, "years").format("DD/MM/YYYY"),
    },
    {
      title: "เวลาเข้า-ออก (ชั่วโมง)",
      key: "workTime",
      render: (_, record) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {record.timeIn || "-"} - {record.timeOut || "-"}
          <div style={{ fontSize: '0.85em', color: 'gray' }}>
            ({record.workHours || 0} ชั่วโมง)
          </div>
        </div>
      ),
    },
    {
      title: "หัวข้องาน",
      dataIndex: "logTitle",
      key: "logTitle",
      render: (title) => title || "-",
    },
    {
      title: "รายละเอียดงาน",
      dataIndex: "workDescription",
      key: "workDescription",
      ellipsis: true, // เพิ่ม ellipsis โดยตรงใน column definition
      render: (desc) => desc || "-",
    },
  ];

  if (loading) {
    return (
      <div className={styles.stateContainer}>
        <Spin size="large" tip="กำลังโหลดข้อมูลการอนุมัติ..." />
      </div>
    );
  }

  // ปรับปรุงการแสดงผลเมื่อมี error หรือ token ถูกใช้งานแล้ว แต่ยังไม่ submitted (เช่น โหลดหน้านี้อีกครั้ง)
  if (error && (!approvalDetails || approvalDetails.status !== 'pending') && !loading && !submitted) {
    return (
      <div className={styles.stateContainer}>
        <Card className={styles.stateCard}>
          <Title level={3} type="danger">
            <ExclamationCircleOutlined className={styles.errorIcon} />
            พบข้อผิดพลาด
          </Title>
          <Text>{error}</Text>
          <Divider />
          <Text type="secondary">
            กรุณาตรวจสอบลิงก์ หรือลองอีกครั้งในภายหลัง หากปัญหายังคงอยู่ กรุณาติดต่อผู้ดูแลระบบ
          </Text>
        </Card>
      </div>
    );
  }


  if (submitted) {
    // ข้อความจะขึ้นอยู่กับสถานะล่าสุดของ approvalDetails
    const alreadyProcessed = approvalDetails?.status && approvalDetails.status !== 'pending';
    const messageText = alreadyProcessed
      ? `การอนุมัตินี้ได้รับการ${approvalDetails.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}เรียบร้อยแล้ว`
      : `การอนุมัติบันทึกการฝึกงานได้รับการดำเนินการเรียบร้อยแล้ว`;

    return (
      <div className={styles.stateContainer}>
        <Card className={styles.stateCard}>
            <Title level={3}>
              <CheckCircleOutlined className={styles.successIcon} />
              ดำเนินการเรียบร้อยแล้ว
            </Title>
            <Text>{messageText}</Text>
            {approvalDetails?.studentName && (
              <Text strong style={{ display: "block", marginTop: "10px" }}>
                นักศึกษา: {approvalDetails.studentName}
              </Text>
            )}
        </Card>
      </div>
    );
  }
  
  // กรณีที่ approvalDetails โหลดมาได้ แต่ status ไม่ใช่ pending (เช่น token ถูกใช้ไปแล้ว)
  // และยังไม่ submitted จากการกระทำในหน้านี้
  if (approvalDetails && approvalDetails.status !== "pending" && !submitted) {
     // หน้านี้จะแสดงผลเหมือน submitted เพื่อป้องกันการดำเนินการซ้ำ
     // อาจจะดีกว่าถ้า redirect หรือแสดงข้อความที่ชัดเจนกว่านี้ว่า token ถูกใช้แล้ว
     // แต่เพื่อความง่าย จะให้แสดงผลเหมือน submitted ไปก่อน
     const messageText = `การอนุมัตินี้ได้รับการ${approvalDetails.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}เรียบร้อยแล้ว`;
     return (
      <div className={styles.stateContainer}>
        <Card className={styles.stateCard}>
            <Title level={3}>
              <CheckCircleOutlined className={styles.successIcon} />
              ดำเนินการเรียบร้อยแล้ว
            </Title>
            <Text>{messageText}</Text>
            {approvalDetails?.studentName && (
              <Text strong style={{ display: "block", marginTop: "10px" }}>
                นักศึกษา: {approvalDetails.studentName}
              </Text>
            )}
        </Card>
      </div>
    );
  }


  return (
    <div className={styles.pageContainer}>
      <Row justify="center">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <Card className={styles.approvalCard} bordered={false}>
            <div className={styles.pageHeaderContainer}>
              {/* เปลี่ยน src ให้เป็น URL โดยตรง */}
              <img 
                src="https://scontent.fbkk8-2.fna.fbcdn.net/v/t39.30808-6/301788674_572678294646260_6080834268011590388_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHwaSCEIyciHQ9-Z6wGmIws4i0v0ruBTi_iLS_Su4FOL5CK_IbRyxDjD9zstvQr1H7IXx4bGPeYg3Z3B84p5BUW&_nc_ohc=YigkqPcMQVIQ7kNvwGtl1In&_nc_oc=Adm8fsT8FsGImJebnMJkyz4vaxyNqWwJVVVywIwbVS3kjM7e--1Rr7gNkijfj4HSvl4&_nc_zt=23&_nc_ht=scontent.fbkk8-2.fna&_nc_gid=na_Qm_pyW_emT-h2pY4Biw&oh=00_AfKQrvC3Ho39f5kM8ftfeQhDh9H89xk0DQVu2mkvCAd4tw&oe=683D1584" 
                alt="โลโก้คณะวิทยาศาสตร์ประยุกต์ มจพ." 
                className={styles.logoImage} 
              />
              <Title level={2} className={styles.pageTitle}>
                การอนุมัติบันทึกการฝึกงาน
              </Title>
            </div>

            {error && !loading && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 20 }}
              />
            )}

            {approvalDetails && (
              <>
                <div className={styles.infoGroup}>
                  <Title level={4} className={styles.sectionTitle}>
                    <InfoCircleOutlined style={{ marginRight: 8 }} /> ข้อมูลนักศึกษาและสถานประกอบการ
                  </Title>
                  <Row gutter={[16, 8]} className={styles.infoRow}>
                    <Col xs={24} md={12}>
                      <Text className={styles.infoLabel}>ชื่อ-สกุลนักศึกษา: </Text>
                      <Text className={styles.infoValue}>{approvalDetails.studentName || "N/A"}</Text>
                    </Col>
                    <Col xs={24} md={12}>
                      <Text className={styles.infoLabel}>รหัสนักศึกษา: </Text>
                      <Text className={styles.infoValue}>{approvalDetails.studentCode || "N/A"}</Text>
                    </Col>
                  </Row>
                  <Row className={styles.infoRow}>
                     <Col xs={24}>
                      <Text className={styles.infoLabel}>สถานประกอบการ: </Text>
                      <Text className={styles.infoValue}>{approvalDetails.companyName || "N/A"}</Text>
                    </Col>
                  </Row>
                </div>

                <Divider />

                <div className={styles.infoGroup}>
                  <Title level={4} className={styles.sectionTitle}>
                    <CalendarOutlined style={{ marginRight: 8 }} /> รายการบันทึกการฝึกงานที่ขออนุมัติ
                  </Title>
                  {approvalDetails.type && (
                    <Tag color="blue" className={styles.statusTag}>
                      ประเภทการขออนุมัติ: {
                        {
                          single: "รายการเดียว",
                          weekly: "รายสัปดาห์",
                          monthly: "รายเดือน",
                          full: "ทั้งหมดที่ยังไม่ได้อนุมัติ",
                        }[approvalDetails.type] || approvalDetails.type
                      }
                    </Tag>
                  )}
                  <Table
                    columns={columns}
                    dataSource={approvalDetails.timesheetEntries || []}
                    rowKey="logId"
                    pagination={{ pageSize: 5, showSizeChanger: false }} // เพิ่ม pagination
                    size="middle" // ปรับขนาดตารางให้ดูมาตรฐานขึ้น
                    className={styles.timesheetTable}
                    scroll={{ x: true }} // เพิ่ม scroll แนวนอนสำหรับจอเล็ก
                  />
                </div>

                <Divider />

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  className={styles.decisionForm}
                >
                  <Title level={4} className={styles.decisionTitle}>
                    การตัดสินใจของท่าน
                  </Title>
                  <Form.Item
                    name="decision"
                    label="กรุณาเลือกการดำเนินการ:"
                    rules={[{ required: true, message: "กรุณาเลือกการดำเนินการ" }]}
                  >
                    <Radio.Group onChange={(e) => setDecision(e.target.value)}>
                      <Space direction="vertical" size="middle">
                        <Radio value="approve" className={styles.radioGroup}>
                          <CheckCircleOutlined className={styles.radioIcon} style={{ color: "#52c41a" }} />
                          อนุมัติรายการทั้งหมด
                        </Radio>
                        <Radio value="reject" className={styles.radioGroup}>
                          <CloseCircleOutlined className={styles.radioIcon} style={{ color: "#ff4d4f" }} />
                          ไม่อนุมัติรายการทั้งหมด
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="comment"
                    label={<span className={styles.commentLabel}>ความคิดเห็น/หมายเหตุ (ไม่บังคับ)</span>}
                  >
                    <TextArea
                      rows={4}
                      placeholder="ระบุเหตุผล ข้อเสนอแนะ หรือหมายเหตุเพิ่มเติม (หากมี)"
                    />
                  </Form.Item>

                  <Form.Item className={styles.submitButtonContainer}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      size="large"
                      icon={<SendOutlined />}
                      className={styles.submitButton}
                    >
                      ส่งการตัดสินใจ
                    </Button>
                  </Form.Item>
                </Form>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TimesheetApproval;
