import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Select, Radio, Card, Typography, Space, 
  Divider, Alert, Spin, message, Rate, Steps, Result
} from 'antd';
import {
  CheckCircleOutlined,
  UserOutlined,
  BankOutlined,
  FormOutlined,
  BookOutlined,
  StarOutlined,
  SendOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import internshipService from '../../../services/internshipService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const SupervisorEvaluation = () => {
  const { token } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchEvaluationData();
  }, [token]);

  const fetchEvaluationData = async () => {
    try {
      setLoading(true);
      const response = await internshipService.getEvaluationFormByToken(token);
      
      if (response.success) {
        setStudentInfo(response.data);
        // ถ้าแบบฟอร์มถูกกรอกแล้ว
        if (response.data.evaluationSubmitted) {
          setSubmitted(true);
        }
      } else {
        setError('ไม่พบข้อมูลนักศึกษาหรือโทเค็นหมดอายุ');
      }
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      setError('ไม่สามารถดึงข้อมูลแบบประเมินได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      const response = await internshipService.submitSupervisorEvaluation({
        token,
        evaluation: values
      });
      
      if (response.success) {
        message.success('บันทึกแบบประเมินเรียบร้อยแล้ว');
        setSubmitted(true);
      } else {
        message.error('ไม่สามารถบันทึกแบบประเมินได้');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกแบบประเมิน');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleNextStep = () => {
    form.validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };
  
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (loading) {
    return (
      <div className="evaluation-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>กำลังโหลดแบบประเมิน...</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evaluation-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <Alert
          message="เกิดข้อผิดพลาด"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="evaluation-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined />}
          title="ส่งแบบประเมินเรียบร้อยแล้ว"
          subTitle={`ขอบคุณที่กรอกแบบประเมินการฝึกงานของ ${studentInfo?.studentName || 'นักศึกษา'}`}
        />
      </div>
    );
  }

  return (
    <div className="evaluation-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <Card className="evaluation-card">
        <Title level={2} style={{ textAlign: 'center' }}>แบบประเมินการฝึกงาน</Title>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Text type="secondary">
            แบบประเมินนี้สำหรับพี่เลี้ยงในการประเมินผลการฝึกงานของนักศึกษา
          </Text>
        </div>

        <Card 
          className="student-info-card"
          title={<><InfoCircleOutlined /> ข้อมูลนักศึกษา</>}
          style={{ marginBottom: 24 }}
        >
          <div className="info-item">
            <div className="info-label"><UserOutlined /> ชื่อ-นามสกุล:</div>
            <div className="info-value">{studentInfo?.studentName || '-'}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><UserOutlined /> รหัสนักศึกษา:</div>
            <div className="info-value">{studentInfo?.studentId || '-'}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><BankOutlined /> สถานประกอบการ:</div>
            <div className="info-value">{studentInfo?.companyName || '-'}</div>
          </div>
        </Card>

        <Steps
          current={currentStep}
          style={{ marginBottom: 24 }}
        >
          <Step title="ทักษะและความสามารถ" />
          <Step title="ความรับผิดชอบและการทำงานร่วมกับผู้อื่น" />
          <Step title="ข้อคิดเห็นเพิ่มเติม" />
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Step 1: ทักษะและความสามารถ */}
          {currentStep === 0 && (
            <>
              <Title level={4}><StarOutlined /> ทักษะและความสามารถในการทำงาน</Title>
              
              <Form.Item
                name="technicalSkill"
                label="1. ทักษะทางเทคนิคและความเข้าใจในงานที่ได้รับมอบหมาย"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>
              
              <Form.Item
                name="problemSolving"
                label="2. ความสามารถในการแก้ไขปัญหา"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>

              <Form.Item
                name="creativeThinking"
                label="3. ความคิดสร้างสรรค์และนวัตกรรม"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>
              
              <Form.Item
                name="learning"
                label="4. ความสามารถในการเรียนรู้สิ่งใหม่"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>

              <Form.Item
                name="skillComment"
                label="ความคิดเห็นเพิ่มเติม (ทักษะและความสามารถ)"
              >
                <TextArea rows={4} />
              </Form.Item>
            </>
          )}

          {/* Step 2: ความรับผิดชอบและการทำงานร่วมกับผู้อื่น */}
          {currentStep === 1 && (
            <>
              <Title level={4}><BookOutlined /> ความรับผิดชอบและการทำงานร่วมกับผู้อื่น</Title>
              
              <Form.Item
                name="reliability"
                label="1. ความรับผิดชอบและความน่าเชื่อถือ"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>
              
              <Form.Item
                name="punctuality"
                label="2. การตรงต่อเวลาและการมาปฏิบัติงาน"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>

              <Form.Item
                name="teamwork"
                label="3. การทำงานเป็นทีมและการมีมนุษยสัมพันธ์ที่ดี"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>
              
              <Form.Item
                name="communication"
                label="4. ทักษะการสื่อสารและการนำเสนอ"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>
              
              <Form.Item
                name="ethic"
                label="5. ความมีระเบียบวินัยและจริยธรรมในการทำงาน"
                rules={[{ required: true, message: 'กรุณาให้คะแนน' }]}
              >
                <Rate allowHalf count={5} />
              </Form.Item>

              <Form.Item
                name="workAttitudeComment"
                label="ความคิดเห็นเพิ่มเติม (ความรับผิดชอบและการทำงานร่วมกับผู้อื่น)"
              >
                <TextArea rows={4} />
              </Form.Item>
            </>
          )}

          {/* Step 3: ข้อคิดเห็นเพิ่มเติม */}
          {currentStep === 2 && (
            <>
              <Title level={4}><FormOutlined /> ข้อคิดเห็นและข้อเสนอแนะ</Title>
              
              <Form.Item
                name="overallRating"
                label="คะแนนการประเมินโดยรวม"
                rules={[{ required: true, message: 'กรุณาให้คะแนนโดยรวม' }]}
              >
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="excellent">ดีเยี่ยม (Excellent)</Radio>
                    <Radio value="good">ดี (Good)</Radio>
                    <Radio value="average">ปานกลาง (Average)</Radio>
                    <Radio value="fair">พอใช้ (Fair)</Radio>
                    <Radio value="poor">ควรปรับปรุง (Poor)</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="strengths"
                label="จุดเด่นของนักศึกษา"
              >
                <TextArea rows={3} />
              </Form.Item>
              
              <Form.Item
                name="improvements"
                label="สิ่งที่ควรปรับปรุง"
              >
                <TextArea rows={3} />
              </Form.Item>
              
              <Form.Item
                name="additionalComments"
                label="ข้อคิดเห็นเพิ่มเติม"
              >
                <TextArea rows={3} />
              </Form.Item>
              
              <Form.Item
                name="supervisorName"
                label="ชื่อผู้ประเมิน"
                rules={[{ required: true, message: 'กรุณาระบุชื่อผู้ประเมิน' }]}
                initialValue={studentInfo?.supervisorName || ''}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name="supervisorPosition"
                label="ตำแหน่ง"
                initialValue={studentInfo?.supervisorPosition || ''}
              >
                <Input />
              </Form.Item>
            </>
          )}

          <Divider />
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {currentStep > 0 && (
              <Button 
                onClick={handlePrevStep}
              >
                ย้อนกลับ
              </Button>
            )}
            
            <div>
              {currentStep < 2 ? (
                <Button 
                  type="primary"
                  onClick={handleNextStep}
                >
                  ถัดไป
                </Button>
              ) : (
                <Button 
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={submitting}
                >
                  ส่งแบบประเมิน
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SupervisorEvaluation;
