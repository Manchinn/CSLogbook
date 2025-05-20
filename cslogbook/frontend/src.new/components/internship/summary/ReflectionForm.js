import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, Space, message, Divider, Alert 
} from 'antd';
import { 
  SaveOutlined, FormOutlined, BookOutlined, 
  BulbOutlined, StarOutlined, ToolOutlined
} from '@ant-design/icons';
import internshipService from '../../../../services/internshipService';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const ReflectionForm = ({ internshipId, onFinish, readOnly, initialData, isSaved }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await internshipService.getReflection(internshipId);
        setInitialValues(result);
        form.setFieldsValue(result);
      } catch (error) {
        message.error('Error fetching reflection data');
      } finally {
        setLoading(false);
      }
    };

    if (internshipId) {
      fetchData();
    }
  }, [internshipId, form]);

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const onFinishSuccess = async (values) => {
    setLoading(true);
    try {
      await internshipService.saveReflection(internshipId, values);
      message.success('Reflection saved successfully');
      if (onFinish) onFinish();
    } catch (error) {
      message.error('Error saving reflection data');
    } finally {
      setLoading(false);
    }
  };

  if (readOnly) {
    return (
      <Card className="reflection-card" variant="borderless">
        <div className="reflection-section">
          <Title level={5}><StarOutlined /> สรุปสิ่งที่ได้เรียนรู้จากการฝึกงาน</Title>
          <Paragraph style={{ whiteSpace: 'pre-line' }}>
            {initialData?.learningOutcome || 'ไม่มีข้อมูล'}
          </Paragraph>
        </div>

        <Divider />
        
        <div className="reflection-section">
          <Title level={5}><BulbOutlined /> ประสบการณ์และทักษะสำคัญที่ได้รับ</Title>
          <Paragraph style={{ whiteSpace: 'pre-line' }}>
            {initialData?.keyLearnings || 'ไม่มีข้อมูล'}
          </Paragraph>
        </div>

        <Divider />
        
        <div className="reflection-section">
          <Title level={5}><BookOutlined /> การนำไปประยุกต์ใช้ในอนาคต</Title>
          <Paragraph style={{ whiteSpace: 'pre-line' }}>
            {initialData?.futureApplication || 'ไม่มีข้อมูล'}
          </Paragraph>
        </div>

        <Divider />
        
        <div className="reflection-section">
          <Title level={5}><ToolOutlined /> สิ่งที่ควรปรับปรุงและพัฒนา</Title>
          <Paragraph style={{ whiteSpace: 'pre-line' }}>
            {initialData?.improvements || 'ไม่มีข้อมูล'}
          </Paragraph>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="reflection-form-card" 
      variant="borderless"
      title={
        <Space>
          <FormOutlined />
          <span>บันทึกสรุปประสบการณ์การฝึกงาน</span>
        </Space>
      }
    >
      {isSaved && (
        <Alert
          message="คุณได้บันทึกข้อมูลแล้ว"
          description="คุณสามารถแก้ไขและบันทึกข้อมูลได้อีกครั้ง"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Paragraph>
        กรุณากรอกข้อมูลเพื่อสรุปประสบการณ์และทักษะที่ได้รับจากการฝึกงาน บทสรุปนี้จะช่วยให้คุณได้ทบทวนสิ่งที่ได้เรียนรู้และวางแผนการพัฒนาในอนาคต
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinishSuccess}
        onFinishFailed={onFinishFailed}
        initialValues={initialValues}
      >
        <Form.Item
          name="title"
          label="Reflection Title"
          rules={[{ required: true, message: 'Please input the title of your reflection!' }]}
        >
          <Input placeholder="Enter the title of your reflection" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Reflection Content"
          rules={[{ required: true, message: 'Please input your reflection content!' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Write your reflection here" 
          />
        </Form.Item>

        <Divider />

        <Form.Item>
          <Space>
            <Button 
              type="default" 
              icon={<FormOutlined />} 
              onClick={() => form.resetFields()}
            >
              Reset
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              loading={loading}
              htmlType="submit"
            >
              Submit Reflection
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ReflectionForm;