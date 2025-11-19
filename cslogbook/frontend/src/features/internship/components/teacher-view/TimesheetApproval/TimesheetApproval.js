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
      
      console.log(`🔍 กำลังเรียก API: /api/email-approval/details/${token.substring(0, 16)}...`);
      
      const response = await fetch(`/api/email-approval/details/${token}`);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // ตรวจสอบ content type ก่อน parse JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`❌ Server ตอบกลับด้วย ${contentType}:`, textResponse);
        throw new Error(`Server ตอบกลับด้วย ${contentType} แทนที่จะเป็น JSON. Response: ${textResponse.substring(0, 200)}...`);
      }
      
      // อ่าน response body
      const data = await response.json();
      console.log(`📄 Response data:`, data);
      
      // ตรวจสอบ HTTP status หลังจากได้ข้อมูลแล้ว
      if (!response.ok) {
        const errorMessage = data.message || `HTTP Error: ${response.status} - ${response.statusText}`;
        console.error(`❌ API Error (${response.status}):`, errorMessage);
        throw new Error(errorMessage);
      }
      
      if (data.success && data.data) {
        console.log(`✅ ได้รับข้อมูลการอนุมัติสำเร็จ:`, data.data);
        setApprovalDetails(data.data);
        if (data.data.status !== "pending") {
          setSubmitted(true);
          if (data.data.status === 'approved') {
            message.info('การอนุมัตินี้ได้รับการอนุมัติไปแล้ว');
          } else if (data.data.status === 'rejected') {
            message.info('การอนุมัตินี้ได้รับการปฏิเสธไปแล้ว');
          }
        }
      } else {
        const errorMsg = data.message || "ไม่สามารถดึงข้อมูลการอนุมัติได้";
        console.error(`❌ API returned unsuccessful:`, data);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("❌ Error fetching approval data:", err);
      
      // ปรับปรุงข้อความ error ให้ชัดเจนขึ้น
      let errorMessage = "เกิดข้อผิดพลาดในการดึงข้อมูล";
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "ไม่สามารถเชื่อมต่อกับ Server ได้ กรุณาตรวจสอบว่า Backend Server ทำงานอยู่หรือไม่";
      } else if (err.message.includes("content-type")) {
        errorMessage = err.message;
      } else if (err.message.includes("HTTP Error: 400")) {
        errorMessage = `ข้อมูล Token ไม่ถูกต้อง: ${err.message}`;
      } else if (err.message.includes("HTTP Error: 404")) {
        errorMessage = "ไม่พบข้อมูลการอนุมัติสำหรับ Token นี้";
      } else if (err.message.includes("HTTP Error: 500")) {
        errorMessage = "เกิดข้อผิดพลาดในระบบ Backend กรุณาลองใหม่อีกครั้ง";
      } else {
        errorMessage = `เกิดข้อผิดพลาด: ${err.message}`;
      }
      
      setError(errorMessage);
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

    // ตรวจสอบการปฏิเสธต้องมี comment
    if (decision === "reject" && (!values.comment || values.comment.trim() === '')) {
      message.error("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // ✅ แก้ไข endpoints ให้ตรงกับ backend routes
      const endpoint =
        decision === "approve"
          ? `/api/email-approval/web/approve/${token}`    // แก้ไขเป็น email-approval
          : `/api/email-approval/web/reject/${token}`;    // แก้ไขเป็น email-approval

      console.log(`Submitting ${decision} to:`, endpoint);
        
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: values.comment || "" }),
      });
      
      // เพิ่มการตรวจสอบ content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server ตอบกลับด้วย ${contentType} แทนที่จะเป็น JSON. คาดว่าจะได้รับ JSON response`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        message.success(
          decision === "approve"
            ? "อนุมัติบันทึกการฝึกงานเรียบร้อยแล้ว"
            : "ปฏิเสธบันทึกการฝึกงานเรียบร้อยแล้ว"
        );
        setSubmitted(true);
        setApprovalDetails(prev => ({...prev, status: decision === 'approve' ? 'approved' : 'rejected'}));
        form.resetFields();
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการดำเนินการ");
        message.error(result.message || "เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (err) {
      console.error("Error submitting approval:", err);
      
      let errorMessage = "เกิดข้อผิดพลาดในการส่งข้อมูล";
      if (err.message.includes("content-type")) {
        errorMessage = "Server ส่ง HTML response แทน JSON กรุณาตรวจสอบ API endpoint";
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "ไม่สามารถเชื่อมต่อกับ Server ได้";
      } else {
        errorMessage = `เกิดข้อผิดพลาด: ${err.message}`;
      }
      
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
        <Spin size="large" spinning={true} tip="กำลังโหลดข้อมูลการอนุมัติ...">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
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
          <Card className={styles.approvalCard} variant="bordered">
            <div className={styles.pageHeaderContainer}>
              {/* เปลี่ยน src ให้เป็น URL โดยตรง */}
              <img 
                src="https://scontent.fbkk8-2.fna.fbcdn.net/v/t39.30808-6/301788674_572678294646260_6080834268011590388_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Qcv_M3Wwaz0Q7kNvwHJQhnG&_nc_oc=Adl3O_3Ti2z62Fb17uIqmxJWV00NajBteIXiY4J9ichzEc5nNDAo-UsSwvA3CEefY8A&_nc_zt=23&_nc_ht=scontent.fbkk8-2.fna&_nc_gid=du5bv_VAyvZFljN579mBzg&oh=00_AfJ32GqhuWgxl3oREYYIE3XUIhjbiaoI1Lq5YwRXSAsHRw&oe=68433C84" 
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
                      ส่งการตรวจบันทึกการฝึกงาน
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
