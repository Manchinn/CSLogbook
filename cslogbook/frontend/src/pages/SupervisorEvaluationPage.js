import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Row, Col, Rate, Select, message, Spin, Divider } from 'antd';
import { getSupervisorEvaluationDetails, submitSupervisorEvaluation } from '../services/evaluationService'; // Import the service

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SupervisorEvaluationPage = () => {
  const [form] = Form.useForm();
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null); // To store student/internship details

  // useEffect to fetch initial data based on the token
  useEffect(() => {
    const fetchEvaluationDetails = async () => {
      // if (token) { // Comment out token check for development
      try {
        setLoading(true);
        // Simulate data fetching for development without a real token
        // const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkZW50SWQiOiIxMjM0NSIsImludGVybnNoaXBMb2dJZCI6IjY3ODkwIiwic3VwZXJ2aXNvckVtYWlsIjoiY2hpbm5ha3JpdDE1MEBnbWFpbC5jb20iLCJ0eXBlIjoic3VwZXJ2aXNvcl9ldmFsdWF0aW9uIiwiaWF0IjoxNzE2MzY0NTYwLCJleHAiOjE3MTY5NjkzNjB9.abcdef123456;
        // const response = await getSupervisorEvaluationDetails(MOCK_TOKEN);
        const response = await getSupervisorEvaluationDetails(token); // Use actual token

        setEvaluationData(response.data);
        form.setFieldsValue({
          supervisorName: response.data.supervisorNameIfKnown || '',
        });
      } catch (error) {
        console.error('Error fetching evaluation details:', error);
        message.error(error.response?.data?.message || error.message || 'ไม่สามารถโหลดข้อมูลเบื้องต้นสำหรับการประเมินได้');
      } finally {
        setLoading(false);
      }
      // } else { // Comment out token check for development
      //   message.error('ไม่พบ Token สำหรับการประเมิน');
      //   setLoading(false);
      // }
    };

    fetchEvaluationDetails();
  }, [token, form, navigate]);

  const onFinish = async (values) => {
    setSubmitting(true);
    const submissionData = { ...values };
    // The loop for ensuring q1-q8 might not be necessary if form has initialValues or all are required.
    // Ant Design Form typically includes values for all fields that have been interacted with or have initial values.

    console.log('Submitting Form values:', submissionData);
    try {
      await submitSupervisorEvaluation(token, submissionData); // Use service
      message.success('ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความร่วมมือ');
      // Navigate to a thank you page or disable the form
      // navigate(`/evaluation/submitted`);
      form.resetFields(); 
      // Consider disabling the form or redirecting:
      // setEvaluationData(prev => ({ ...prev, submitted: true })); // Add a submitted flag to state
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      // apiClient error interceptor might have already shown a message
      message.error(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการส่งแบบประเมิน');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
        <Text style={{ marginLeft: 16 }}>กำลังโหลดข้อมูลแบบประเมิน...</Text>
      </div>
    );
  }

  if (!evaluationData && !loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 50 }}>
        <Title level={3} type="danger">ไม่สามารถโหลดข้อมูลการประเมินได้</Title>
        <Text>อาจเป็นเพราะลิงก์ไม่ถูกต้อง หมดอายุแล้ว หรือเกิดข้อผิดพลาดในการเชื่อมต่อ</Text>
      </div>
    );
  }

  // if (evaluationData?.submitted) { // Example: Show if form was already submitted
  //   return (
  //     <div style={{ textAlign: 'center', marginTop: 50 }}>
  //       <Title level={3}>ขอบคุณ</Title>
  //       <Text>แบบประเมินนี้ได้ถูกส่งเข้าระบบเรียบร้อยแล้ว</Text>
  //     </div>
  //   );
  // }
  
  // Define rating descriptors for Ant Design Rate component
  const ratingDescriptors = ['แย่มาก', 'แย่', 'พอใช้', 'ดี', 'ดีมาก'];

  return (
    <Row justify="center" style={{ marginTop: '20px', padding: '0 20px' }}>
      <Col xs={24} sm={20} md={16} lg={14} xl={12}>
        <Card>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
            แบบประเมินผลการฝึกงาน/สหกิจศึกษา
          </Title>
          
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Title level={4}>ข้อมูลนักศึกษาและสถานประกอบการ</Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="ชื่อ-สกุลนักศึกษา">
                  <Input value={evaluationData?.studentName} disabled />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="รหัสนักศึกษา">
                  <Input value={evaluationData?.studentId} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="สถานประกอบการ">
              <Input value={evaluationData?.companyName} disabled />
            </Form.Item>
            <Form.Item label="ช่วงเวลาปฏิบัติงาน">
              <Input value={evaluationData?.evaluationPeriod} disabled />
            </Form.Item>

            <Divider />

            <Title level={4}>ข้อมูลผู้ประเมิน (พี่เลี้ยง/หัวหน้างาน)</Title>
            <Form.Item
              name="evaluatorName"
              label="ชื่อ-สกุล ผู้ประเมิน"
              rules={[{ required: true, message: 'กรุณาระบุชื่อผู้ประเมิน' }]}
            >
              <Input placeholder="เช่น นายสมศักดิ์ ใจดี" />
            </Form.Item>
            <Form.Item
              name="evaluatorPosition"
              label="ตำแหน่ง ผู้ประเมิน"
              rules={[{ required: true, message: 'กรุณาระบุตำแหน่งผู้ประเมิน' }]}
            >
              <Input placeholder="เช่น Senior Software Engineer" />
            </Form.Item>
            <Form.Item
              name="evaluatorEmail"
              label="อีเมล ผู้ประเมิน"
              rules={[
                { required: true, message: 'กรุณาระบุอีเมลผู้ประเมิน' },
                { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
              ]}
            >
              <Input placeholder="เช่น supervisor.email@example.com" />
            </Form.Item>

            <Divider />
            <Title level={4}>ส่วนที่ 1: การประเมินผลการปฏิบัติงาน</Title>
            <Text type="secondary" style={{display: 'block', marginBottom: 16}}>
              โปรดให้คะแนนในแต่ละหัวข้อต่อไปนี้ (5 = ดีมาก, 4 = ดี, 3 = พอใช้, 2 = แย่, 1 = แย่มาก)
            </Text>

            {/* Corresponds to q1Knowledge to q8Personality from InternshipEvaluation.js */}
            <Form.Item name="q1Knowledge" label="ความรู้ความสามารถในงาน (Knowledge and Skills)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item name="q2Responsibility" label="ความรับผิดชอบต่องานที่ได้รับมอบหมาย (Responsibility)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item name="q3Initiative" label="ความคิดริเริ่มสร้างสรรค์ (Initiative and Creativity)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item name="q4Adaptability" label="ความสามารถในการปรับตัวเข้ากับเพื่อนร่วมงานและองค์กร (Adaptability)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item name="q5ProblemSolving" label="ความสามารถในการเรียนรู้และแก้ไขปัญหา (Learning and Problem Solving)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item name="q6Communication" label="ทักษะการสื่อสาร (Communication Skills)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item name="q7Punctuality" label="ความตรงต่อเวลาและการรักษาระเบียบวินัย (Punctuality and Discipline)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>
            <Form.Item name="q8Personality" label="บุคลิกภาพโดยรวม (Overall Personality)" rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}>
              <Rate tooltips={ratingDescriptors} count={5} />
            </Form.Item>

            <Divider />
            <Title level={4}>ส่วนที่ 2: สรุปและข้อเสนอแนะ</Title>
            <Form.Item name="strengths" label="จุดเด่นของนักศึกษา (Strengths)">
              <TextArea rows={4} placeholder="อธิบายจุดเด่นหรือสิ่งที่นักศึกษาทำได้ดี" />
            </Form.Item>
            <Form.Item name="weaknessesToImprove" label="สิ่งที่ควรปรับปรุงและพัฒนา (Areas for Improvement)">
              <TextArea rows={4} placeholder="อธิบายสิ่งที่นักศึกษาควรปรับปรุงหรือพัฒนาเพิ่มเติม" />
            </Form.Item>
            <Form.Item name="additionalComments" label="ข้อเสนอแนะเพิ่มเติม (Additional Comments)">
              <TextArea rows={4} placeholder="ข้อคิดเห็นหรือข้อเสนอแนะอื่นๆ (ถ้ามี)" />
            </Form.Item>
            <Form.Item 
              name="overallGrade" 
              label="ผลการประเมินโดยรวม (Overall Performance)"
              rules={[{ required: true, message: 'กรุณาเลือกผลการประเมินโดยรวม' }]}
            >
              <Select placeholder="เลือกผลการประเมิน">
                <Option value="A">ดีเยี่ยม (Excellent)</Option>
                <Option value="B+">ดีมาก (Very Good)</Option>
                <Option value="B">ดี (Good)</Option>
                <Option value="C+">ค่อนข้างดี (Fairly Good)</Option>
                <Option value="C">พอใช้ (Fair)</Option>
                <Option value="D+">ต้องปรับปรุง (Needs Improvement)</Option>
                <Option value="D">ต้องปรับปรุงมาก (Significant Improvement Needed)</Option>
                {/* <Option value="F">ไม่ผ่าน (Fail)</Option> */}
              </Select>
            </Form.Item>

            <Divider />
            <Form.Item style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button type="primary" htmlType="submit" loading={submitting} size="large">
                ส่งแบบประเมิน
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default SupervisorEvaluationPage;
