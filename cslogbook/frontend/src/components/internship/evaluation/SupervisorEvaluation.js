import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Alert,
  Spin,
  message,
  Rate,
  Row,
  Col,
  Space,
  Tag,
  Radio,
  Progress,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  SendOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  getSupervisorEvaluationDetails,
  submitSupervisorEvaluation,
} from "../../../services/evaluationService";
import moment from "moment";
// import { DATE_FORMAT_MEDIUM } from "../../../utils/constants"; // ไม่ได้ใช้งานหลังปรับโครงสร้าง

const { Title, Text } = Typography;
const { TextArea } = Input;
// const { Option } = Select; // ไม่ได้ใช้งานหลังปรับโครงสร้าง (ตัด overallGrade)

const SupervisorEvaluation = () => {
  console.log("SupervisorEvaluation component rendering");
  const { token } = useParams();
  console.log("Token from useParams:", token);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [evaluationDetails, setEvaluationDetails] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [liveScores, setLiveScores] = useState({
    discipline: [null,null,null,null],
    behavior: [null,null,null,null],
    performance: [null,null,null,null],
    method: [null,null,null,null],
    relation: [null,null,null,null],
    decision: null,
  });
  const computeSubtotal = (arr)=> arr.reduce((a,b)=> a + (Number.isInteger(b)? b:0),0);
  const totalScore = ['discipline','behavior','performance','method','relation']
    .map(k=>computeSubtotal(liveScores[k]))
    .reduce((a,b)=>a+b,0);
  const passByRule = totalScore >= 70;
  const finalPass = passByRule && liveScores.decision === true;

  const fetchEvaluationData = useCallback(async () => {
    console.log("Entering fetchEvaluationData. Token:", token);
    if (!token) {
      console.error("No token provided for evaluation.");
      setError("ไม่พบ Token สำหรับการประเมิน หรือ Token ไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getSupervisorEvaluationDetails(token);
      console.log("✅ API Response in fetchEvaluationData:", response);

      if (response && response.data && response.data.success && response.data.data) {
        console.log("✅ Fetched Evaluation Data (payload):", response.data.data);
        setEvaluationDetails(response.data.data);

        // ✅ Pre-fill supervisor details from internshipInfo
        if (response.data.data.internshipInfo) {
          const { supervisorName, supervisorPosition, supervisorEmail, supervisorPhone } = response.data.data.internshipInfo;
          
          form.setFieldsValue({
            supervisorName: supervisorName || '',
            supervisorPosition: supervisorPosition || '',
            supervisorEmail: supervisorEmail || '',
            supervisorPhone: supervisorPhone || '',
          });
        }

        // ตรวจสอบว่าการประเมินถูกส่งแล้วหรือไม่
        if (response.data.data.evaluationSubmitted || response.data.data.evaluationDetails?.status === 'completed') {
          console.log("✅ Evaluation already submitted according to API.");
          setSubmitted(true);
        } else {
          setSubmitted(false);
        }
      } else {
        let errorMessage = "ข้อมูลแบบประเมินไม่สมบูรณ์ หรือไม่พบข้อมูล";
        if (response && response.data && response.data.message) {
          errorMessage = response.data.message;
        }
        console.warn("API call response not as expected or indicates failure:", response);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("❌ Catch block in fetchEvaluationData:", err, err?.response, err?.response?.data);
      let errorMessage = "ไม่สามารถดึงข้อมูลแบบประเมินได้";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, form]);

  useEffect(() => {
    console.log("useEffect for fetchEvaluationData triggered. Token:", token);
    fetchEvaluationData();
  }, [token, fetchEvaluationData]);

  const handleRateChange = (category, index, value) => {
    setLiveScores(prev => {
      const updated = { ...prev, [category]: [...prev[category]] };
      updated[category][index] = value;
      return updated;
    });
  };

  const handleDecisionChange = e => {
    setLiveScores(prev => ({ ...prev, decision: e.target.value === 'pass' }));
  };

  const handleSubmit = async (values) => {
    console.log("📝 Submitting Form values:", values);
    setSubmitting(true);
    setError(null);

    // ✅ เตรียมข้อมูลสำหรับส่ง (แปลงเป็น format ที่ backend ต้องการ)
    const submissionData = {
      supervisorName: values.supervisorName,
      supervisorPosition: values.supervisorPosition,
      supervisorDecision: liveScores.decision === true,
      categories: {
        discipline: liveScores.discipline.map(v=>v||0),
        behavior: liveScores.behavior.map(v=>v||0),
        performance: liveScores.performance.map(v=>v||0),
        method: liveScores.method.map(v=>v||0),
        relation: liveScores.relation.map(v=>v||0),
      },
      strengths: values.strengths,
      improvements: values.weaknessesToImprove,
      additionalComments: values.additionalComments || null,
    };

    console.log("📤 Final Submission Data:", submissionData);

    try {
      const response = await submitSupervisorEvaluation(token, submissionData);
      if (response && response.data && response.data.success) {
        message.success(
          response.data.message ||
            "ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความร่วมมือ"
        );
        setSubmitted(true);
        form.resetFields();
      } else {
        const errorMessage =
          response?.data?.message ||
          "เกิดข้อผิดพลาดในการส่งแบบประเมิน แต่ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์";
        console.error("❌ Submission API error (but success false or no data):", response);
        setError(errorMessage);
        message.error(errorMessage);
      }
    } catch (err) {
      console.error("❌ Error submitting evaluation (catch block):", err, err?.response, err?.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "เกิดข้อผิดพลาดในการส่งแบบประเมิน";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Format date helper function
  const formatThaiDate = (dateString) => {
    if (!dateString) return "ไม่ระบุ";
    return moment(dateString).add(543, "years").format("DD MMMM YYYY");
  };

  // ✅ Check if token is expired
  const isTokenExpired = () => {
    if (!evaluationDetails?.evaluationDetails?.expiresAt) return false;
    return moment().isAfter(moment(evaluationDetails.evaluationDetails.expiresAt));
  };

  if (loading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Col>
          <Spin size="large" tip="กำลังโหลดข้อมูลแบบประเมิน..." />
        </Col>
      </Row>
    );
  }

  if (error && !evaluationDetails && !loading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "80vh", padding: "20px" }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Title level={3} type="danger">
                พบข้อผิดพลาด
              </Title>
              <Text>{error}</Text>
              <Divider />
              <Text type="secondary">
                กรุณาตรวจสอบลิงก์ หรือลองอีกครั้งในภายหลัง
                หากยังพบปัญหากรุณาติดต่อผู้ดูแลระบบ
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  if (submitted) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "80vh", padding: "20px" }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Title level={3}>
                <CheckCircleOutlined style={{ color: "#52c41a" }} /> ขอบคุณสำหรับการประเมิน
              </Title>
              <Text>แบบประเมินของท่านได้ถูกส่งเข้าระบบเรียบร้อยแล้ว</Text>
              {evaluationDetails?.studentInfo?.fullName && (
                <Text strong style={{ display: "block", marginTop: "10px" }}>
                  นักศึกษา: {evaluationDetails.studentInfo.fullName}
                </Text>
              )}
              {evaluationDetails?.internshipInfo?.companyName && (
                <Text style={{ display: "block", marginTop: "5px" }}>
                  บริษัท: {evaluationDetails.internshipInfo.companyName}
                </Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  // ✅ Check for token expiration
  if (isTokenExpired()) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "80vh", padding: "20px" }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Title level={3} type="warning">
                <ClockCircleOutlined /> ลิงก์การประเมินหมดอายุแล้ว
              </Title>
              <Text>
                ลิงก์สำหรับการประเมินนี้ได้หมดอายุแล้ว กรุณาติดต่อเจ้าหน้าที่เพื่อขอลิงก์ใหม่
              </Text>
              <Divider />
              <Text type="secondary">
                หมดอายุเมื่อ: {formatThaiDate(evaluationDetails?.evaluationDetails?.expiresAt)}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  if (!evaluationDetails && !loading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "80vh", padding: "20px" }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Title level={3} type="warning">
                ไม่พบข้อมูลการประเมิน
              </Title>
              <Text>
                ไม่สามารถโหลดรายละเอียดสำหรับการประเมินนี้ได้
                อาจเป็นเพราะลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  const ratingDescriptors = ["แย่มาก", "แย่", "พอใช้", "ดี", "ดีมาก"];

  // ใช้ CATEGORY_CONFIG ส่วนกลาง
  const { CATEGORY_CONFIG } = require('./evaluationConfig');

  return (
    <Row justify="center" style={{ marginTop: "20px", padding: "0 20px", marginBottom: "40px" }}>
      <Col xs={24} sm={22} md={20} lg={18} xl={16}>
        <Card bordered={false} style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
            แบบประเมินผลการฝึกงาน
          </Title>

          {/* ✅ แสดงข้อมูลสถานะและวันหมดอายุ */}
          <Row justify="center" style={{ marginBottom: "24px" }}>
            <Col>
              <Space direction="vertical" align="center">
                <Tag color="blue">
                  <CalendarOutlined /> ส่งเมื่อ: {formatThaiDate(evaluationDetails?.evaluationDetails?.sentDate)}
                </Tag>
                <Tag color="orange">
                  <ClockCircleOutlined /> หมดอายุ: {formatThaiDate(evaluationDetails?.evaluationDetails?.expiresAt)}
                </Tag>
              </Space>
            </Col>
          </Row>

          {error && !loading && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {/* ✅ ข้อมูลนักศึกษาและสถานประกอบการ */}
            <Title level={4}>
              <InfoCircleOutlined /> ข้อมูลนักศึกษาและสถานประกอบการ
            </Title>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="ชื่อ-สกุลนักศึกษา">
                  <Input
                    value={evaluationDetails?.studentInfo?.fullName || "ไม่ระบุ"}
                    disabled
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="รหัสนักศึกษา">
                  <Input
                    value={evaluationDetails?.studentInfo?.studentCode || "ไม่ระบุ"}
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="อีเมลนักศึกษา">
                  <Input
                    value={evaluationDetails?.studentInfo?.email || "ไม่ระบุ"}
                    disabled
                    prefix={<MailOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="ตำแหน่งการฝึกงาน">
                  <Input
                    value={evaluationDetails?.internshipInfo?.internshipPosition || "ไม่ระบุ"}
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="สถานประกอบการ">
              <Input
                value={evaluationDetails?.internshipInfo?.companyName || "ไม่ระบุ"}
                disabled
                prefix={<EnvironmentOutlined />}
              />
            </Form.Item>

            <Form.Item label="ที่อยู่สถานประกอบการ">
              <Input
                value={evaluationDetails?.internshipInfo?.companyAddress || "ไม่ระบุ"}
                disabled
                prefix={<EnvironmentOutlined />}
              />
            </Form.Item>

            <Form.Item label="ช่วงเวลาการฝึกงาน">
              <Input
                value={
                  evaluationDetails?.internshipInfo?.startDate && evaluationDetails?.internshipInfo?.endDate
                    ? `${formatThaiDate(evaluationDetails.internshipInfo.startDate)} ถึง ${formatThaiDate(evaluationDetails.internshipInfo.endDate)}`
                    : "ไม่ระบุ"
                }
                disabled
                prefix={<CalendarOutlined />}
              />
            </Form.Item>

            <Divider />

            {/* ✅ ข้อมูลผู้ประเมิน */}
            <Title level={4}>
              <UserOutlined /> ข้อมูลผู้ประเมิน (พี่เลี้ยง/หัวหน้างาน)
            </Title>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="supervisorName"
                  label="ชื่อ-สกุล ผู้ประเมิน"
                  rules={[{ required: true, message: "กรุณาระบุชื่อผู้ประเมิน" }]}
                >
                  <Input 
                    placeholder="เช่น นายสมศักดิ์ ใจดี" 
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="supervisorPosition"
                  label="ตำแหน่ง ผู้ประเมิน"
                  rules={[{ required: true, message: "กรุณาระบุตำแหน่งผู้ประเมิน" }]}
                >
                  <Input placeholder="เช่น Senior Software Engineer" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="supervisorEmail"
                  label="อีเมล ผู้ประเมิน"
                  rules={[
                    { required: true, message: "กรุณาระบุอีเมลผู้ประเมิน" },
                    { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                  ]}
                >
                  <Input 
                    placeholder="เช่น supervisor.email@example.com" 
                    prefix={<MailOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="supervisorPhone"
                  label="เบอร์โทรศัพท์ ผู้ประเมิน"
                >
                  <Input 
                    placeholder="เช่น 02-123-4567" 
                    prefix={<PhoneOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* ✅ การประเมินผลการปฏิบัติงาน */}
            <Title level={4}>ส่วนที่ 1: การประเมินผลการปฏิบัติงาน</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              ให้คะแนนแต่ละข้อ (1–5) ระบบจะรวมอัตโนมัติ (ผ่านเมื่อ ≥ 70 และผู้ประเมินเลือกผ่าน)
            </Text>

            {CATEGORY_CONFIG.map(cat => (
              <Card key={cat.key} size="small" style={{ marginBottom: 16, border: '1px solid #f0f0f0' }}>
                <Title level={5} style={{ marginBottom: 12 }}>{cat.title} <Tag color={computeSubtotal(liveScores[cat.key])===20?'green':'blue'}>{computeSubtotal(liveScores[cat.key])}/20</Tag></Title>
                {cat.items.map((label, idx)=>(
                  <Form.Item key={cat.key+idx} label={label} required>
                    <Rate
                      tooltips={ratingDescriptors}
                      count={5}
                      value={liveScores[cat.key][idx] || 0}
                      onChange={(val)=>handleRateChange(cat.key, idx, val)}
                    />
                  </Form.Item>
                ))}
              </Card>
            ))}

            <Card size="small" style={{ marginBottom: 24, background:'#fafafa' }}>
              <Space direction="vertical" style={{ width:'100%' }}>
                <Text strong>สรุปคะแนนรวม: <span style={{ color: totalScore>=70? '#3f8600':'#cf1322' }}>{totalScore} / 100</span></Text>
                <Progress percent={Math.round((totalScore/100)*100)} status={totalScore>=70? 'success':'active'} />
                <Form.Item name="supervisorDecision" label="การตัดสินของผู้ประเมิน" rules={[{ required: true, message: 'กรุณาเลือกการตัดสิน' }]}>
                  <Radio.Group onChange={handleDecisionChange} value={liveScores.decision === null ? undefined : (liveScores.decision ? 'pass':'fail')}>
                    <Radio value="pass">ผ่าน</Radio>
                    <Radio value="fail">ไม่ผ่าน</Radio>
                  </Radio.Group>
                </Form.Item>
                <Alert
                  type={finalPass? 'success': 'warning'}
                  showIcon
                  message={finalPass? 'ผลสรุปเบื้องต้น: ผ่าน' : 'ผลสรุปเบื้องต้น: ยังไม่ผ่าน'}
                  description={
                    <div>
                      <div>เกณฑ์: คะแนนรวม ≥ 70 และผู้ประเมินเลือก "ผ่าน"</div>
                      {!passByRule && <div>- คะแนนยังไม่ถึง 70</div>}
                      {passByRule && liveScores.decision === false && <div>- ผู้ประเมินเลือกไม่ผ่าน</div>}
                      {liveScores.decision === true && !passByRule && <div>- แม้เลือกผ่าน แต่คะแนนยังไม่ถึงเกณฑ์</div>}
                    </div>
                  }
                />
              </Space>
            </Card>

            <Divider />
            <Title level={4}>ส่วนที่ 2: สรุปและข้อเสนอแนะ</Title>

            <Form.Item 
              name="strengths" 
              label="จุดเด่นของนักศึกษา (Strengths)"
              rules={[{ required: true, message: "กรุณาระบุจุดเด่นของนักศึกษา" }]}
            >
              <TextArea
                rows={4}
                placeholder="อธิบายจุดเด่นหรือสิ่งที่นักศึกษาทำได้ดี"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="weaknessesToImprove"
              label="สิ่งที่ควรปรับปรุงและพัฒนา (Areas for Improvement)"
              rules={[{ required: true, message: "กรุณาระบุสิ่งที่ควรปรับปรุง" }]}
            >
              <TextArea
                rows={4}
                placeholder="อธิบายสิ่งที่นักศึกษาควรปรับปรุงหรือพัฒนาเพิ่มเติม"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="additionalComments"
              label="ข้อเสนอแนะเพิ่มเติม (Additional Comments)"
            >
              <TextArea
                rows={4}
                placeholder="ข้อคิดเห็นหรือข้อเสนอแนะอื่นๆ (ถ้ามี)"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Divider />

            <Form.Item style={{ textAlign: "center", marginTop: "30px" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<SendOutlined />}
                style={{ 
                  minWidth: "200px",
                  height: "50px",
                  fontSize: "16px"
                }}
              >
                ส่งแบบประเมิน
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default SupervisorEvaluation;