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
  Select,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  SendOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  getSupervisorEvaluationDetails,
  submitSupervisorEvaluation,
} from "../../../services/evaluationService";
import moment from "moment";
import { DATE_FORMAT_MEDIUM } from "../../../utils/constants";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
      console.log("API Response in fetchEvaluationData:", response);

      if (
        response &&
        response.data &&
        response.data.success &&
        response.data.data
      ) {
        console.log("Fetched Evaluation Data (payload):", response.data.data);
        setEvaluationDetails(response.data.data);

        // Pre-fill evaluator details if available from backend
        // These might be supervisor details linked to the token or previously entered
        if (response.data.data.evaluatorName) {
          // Assuming backend might send this
          form.setFieldsValue({
            evaluatorName: response.data.data.evaluatorName,
          });
        }
        if (response.data.data.evaluatorPosition) {
          // Assuming backend might send this
          form.setFieldsValue({
            evaluatorPosition: response.data.data.evaluatorPosition,
          });
        }
        if (response.data.data.evaluatorEmail) {
          // Assuming backend might send this
          form.setFieldsValue({
            evaluatorEmail: response.data.data.evaluatorEmail,
          });
        }

        if (response.data.data.evaluationSubmitted) {
          console.log("Evaluation already submitted according to API.");
          setSubmitted(true);
        } else {
          setSubmitted(false);
        }
      } else {
        let errorMessage = "ข้อมูลแบบประเมินไม่สมบูรณ์ หรือไม่พบข้อมูล";
        if (response && response.data && response.data.message) {
          errorMessage = response.data.message;
        }
        console.warn(
          "API call response not as expected or indicates failure:",
          response
        );
        setError(errorMessage);
      }
    } catch (err) {
      console.error(
        "Catch block in fetchEvaluationData:",
        err,
        err?.response,
        err?.response?.data
      );
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

  const handleSubmit = async (values) => {
    console.log("Submitting Form values:", values);
    setSubmitting(true);
    setError(null);

    // Prepare submission data (q1-q8 are now directly from form values)
    const submissionData = { ...values };
    console.log("Final Submission Data:", submissionData);

    try {
      const response = await submitSupervisorEvaluation(token, submissionData);
      if (response && response.data && response.data.success) {
        message.success(
          response.data.message ||
            "ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความร่วมมือ"
        );
        setSubmitted(true);
        form.resetFields();
        // navigate(`/evaluation/thankyou`); // Optional: navigate to a thank you page
      } else {
        const errorMessage =
          response?.data?.message ||
          "เกิดข้อผิดพลาดในการส่งแบบประเมิน แต่ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์";
        console.error(
          "Submission API error (but success false or no data):",
          response
        );
        setError(errorMessage);
        message.error(errorMessage);
      }
    } catch (err) {
      console.error(
        "Error submitting evaluation (catch block):",
        err,
        err?.response,
        err?.response?.data
      );
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
    // Show error if evaluationDetails is still null
    return (
      <Row
        justify="center"
        align="middle"
        style={{ minHeight: "80vh", padding: "20px" }}
      >
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
      <Row
        justify="center"
        align="middle"
        style={{ minHeight: "80vh", padding: "20px" }}
      >
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Title level={3}>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />{" "}
                ขอบคุณสำหรับการประเมิน
              </Title>
              <Text>แบบประเมินของท่านได้ถูกส่งเข้าระบบเรียบร้อยแล้ว</Text>
              {evaluationDetails?.student?.fullName && ( // Adjusted to new data structure
                <Text strong style={{ display: "block", marginTop: "10px" }}>
                  นักศึกษา: {evaluationDetails.student.fullName}
                </Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  if (!evaluationDetails && !loading) {
    // If no data and not loading (and no specific error was set)
    return (
      <Row
        justify="center"
        align="middle"
        style={{ minHeight: "80vh", padding: "20px" }}
      >
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

  return (
    // Adopted Row/Col structure from SupervisorEvaluationPage for better responsiveness
    <Row
      justify="center"
      style={{ marginTop: "20px", padding: "0 20px", marginBottom: "40px" }}
    >
      <Col xs={24} sm={22} md={20} lg={18} xl={16}>
        <Card
          bordered={false}
          style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
        >
          <Title
            level={2}
            style={{ textAlign: "center", marginBottom: "24px" }}
          >
            แบบประเมินผลการฝึกงาน/สหกิจศึกษา
          </Title>

          {error &&
            !loading && ( // Display general errors that occur after initial load or during submission
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 20 }}
              />
            )}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Title level={4}>
              <InfoCircleOutlined /> ข้อมูลนักศึกษาและสถานประกอบการ
            </Title>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="ชื่อ-สกุลนักศึกษา">
                  {/* Assuming evaluationDetails.student.fullName and student.studentId from backend */}
                  <Input
                    value={
                      evaluationDetails?.studentInfo?.fullName ||
                      evaluationDetails?.studentName ||
                      "N/A"
                    }
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="รหัสนักศึกษา">
                  <Input
                    value={
                      evaluationDetails?.studentInfo?.studentCode ||
                      evaluationDetails?.studentId ||
                      "N/A"
                    }
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="สถานประกอบการ">
              <Input
                value={
                  evaluationDetails?.companyInfo?.companyName ||
                  evaluationDetails?.companyName ||
                  "N/A"
                }
                disabled
              />
            </Form.Item>
            <Form.Item label="ช่วงเวลาปฏิบัติงาน">
              {/* Assuming evaluationDetails.internship.evaluationPeriod */}
              <Input
                value={
                  evaluationDetails?.internshipPeriod?.startDate &&
                  evaluationDetails?.internshipPeriod?.endDate
                    ? `${moment(evaluationDetails.internshipPeriod.startDate)
                        .add(543, "years")
                        .format(DATE_FORMAT_MEDIUM)} - ${moment(
                        evaluationDetails.internshipPeriod.endDate
                      )
                        .add(543, "years")
                        .format(DATE_FORMAT_MEDIUM)}`
                    : "N/A"
                }
                disabled
              />
            </Form.Item>
            <Divider />
            <Title level={4}>
              <UserOutlined /> ข้อมูลผู้ประเมิน (พี่เลี้ยง/หัวหน้างาน)
            </Title>
            <Form.Item
              name="evaluatorName"
              label="ชื่อ-สกุล ผู้ประเมิน"
              rules={[{ required: true, message: "กรุณาระบุชื่อผู้ประเมิน" }]}
            >
              <Input placeholder="เช่น นายสมศักดิ์ ใจดี" />
            </Form.Item>
            <Form.Item
              name="evaluatorPosition"
              label="ตำแหน่ง ผู้ประเมิน"
              rules={[
                { required: true, message: "กรุณาระบุตำแหน่งผู้ประเมิน" },
              ]}
            >
              <Input placeholder="เช่น Senior Software Engineer" />
            </Form.Item>
            <Form.Item
              name="evaluatorEmail"
              label="อีเมล ผู้ประเมิน"
              rules={[
                { required: true, message: "กรุณาระบุอีเมลผู้ประเมิน" },
                { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
              ]}
            >
              <Input placeholder="เช่น supervisor.email@example.com" />
            </Form.Item>
            <Divider />
            <Title level={4}>ส่วนที่ 1: การประเมินผลการปฏิบัติงาน</Title>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 16 }}
            >
              โปรดให้คะแนนในแต่ละหัวข้อต่อไปนี้ (5 = ดีมาก, 4 = ดี, 3 = พอใช้, 2
              = แย่, 1 = แย่มาก)
            </Text>
            {/* Questions q1-q8, similar to SupervisorEvaluationPage.js */}
            <Form.Item
              name="q1Knowledge"
              label="1. ความรู้ความสามารถในงาน (Knowledge and Skills)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item
              name="q2Responsibility"
              label="2. ความรับผิดชอบต่องานที่ได้รับมอบหมาย (Responsibility)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item
              name="q3Initiative"
              label="3. ความคิดริเริ่มสร้างสรรค์ (Initiative and Creativity)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item
              name="q4Adaptability"
              label="4. ความสามารถในการปรับตัวเข้ากับเพื่อนร่วมงานและองค์กร (Adaptability)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item
              name="q5ProblemSolving"
              label="5. ความสามารถในการเรียนรู้และแก้ไขปัญหา (Learning and Problem Solving)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item
              name="q6Communication"
              label="6. ทักษะการสื่อสาร (Communication Skills)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item
              name="q7Punctuality"
              label="7. ความตรงต่อเวลาและการรักษาระเบียบวินัย (Punctuality and Discipline)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item
              name="q8Personality"
              label="8. บุคลิกภาพโดยรวม (Overall Personality)"
              rules={[{ required: true, message: "กรุณาให้คะแนน" }]}
            >
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Divider />
            <Title level={4}>ส่วนที่ 2: สรุปและข้อเสนอแนะ</Title>
            <Form.Item name="strengths" label="จุดเด่นของนักศึกษา (Strengths)">
              <TextArea
                rows={4}
                placeholder="อธิบายจุดเด่นหรือสิ่งที่นักศึกษาทำได้ดี"
              />
            </Form.Item>
            <Form.Item
              name="weaknessesToImprove"
              label="สิ่งที่ควรปรับปรุงและพัฒนา (Areas for Improvement)"
            >
              <TextArea
                rows={4}
                placeholder="อธิบายสิ่งที่นักศึกษาควรปรับปรุงหรือพัฒนาเพิ่มเติม"
              />
            </Form.Item>
            <Form.Item
              name="additionalComments"
              label="ข้อเสนอแนะเพิ่มเติม (Additional Comments)"
            >
              <TextArea
                rows={4}
                placeholder="ข้อคิดเห็นหรือข้อเสนอแนะอื่นๆ (ถ้ามี)"
              />
            </Form.Item>
            <Form.Item
              name="overallGrade"
              label="ผลการประเมินโดยรวม (Overall Performance)"
              rules={[
                { required: true, message: "กรุณาเลือกผลการประเมินโดยรวม" },
              ]}
            >
              <Select placeholder="เลือกผลการประเมิน">
                <Option value="A">ดีเยี่ยม (Excellent)</Option>
                <Option value="B+">ดีมาก (Very Good)</Option>
                <Option value="B">ดี (Good)</Option>
                <Option value="C+">ค่อนข้างดี (Fairly Good)</Option>
                <Option value="C">พอใช้ (Fair)</Option>
                <Option value="D+">ต้องปรับปรุง (Needs Improvement)</Option>
                <Option value="D">
                  ต้องปรับปรุงมาก (Significant Improvement Needed)
                </Option>
              </Select>
            </Form.Item>
            <Divider />
            <Form.Item style={{ textAlign: "center", marginTop: "30px" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<SendOutlined />}
                style={{ minWidth: "200px" }} // Ensure button is wide enough
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
