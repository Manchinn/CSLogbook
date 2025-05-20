import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, Space, message, Divider, Alert 
} from 'antd';
import { 
  SaveOutlined, FormOutlined, BookOutlined, 
  BulbOutlined, StarOutlined, ToolOutlined
} from '@ant-design/icons';
import internshipService from '../../../../../services/internshipService'; // Updated path

const { TextArea } = Input;
const { Title, Paragraph } = Typography; // Fixed: Removed unused 'Text'

const ReflectionForm = ({ onSave, initialData, readOnly = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        learningOutcome: initialData.learningOutcome || '',
        keyLearnings: initialData.keyLearnings || '',
        futureApplication: initialData.futureApplication || '',
        improvements: initialData.improvements || ''
      });

      if (initialData.learningOutcome || initialData.keyLearnings || 
          initialData.futureApplication || initialData.improvements) {
        setIsSaved(true);
      }
    }
  }, [initialData, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await internshipService.saveReflection(values);
      
      if (response && response.success) {
        message.success('บันทึกบทสรุปเรียบร้อยแล้ว');
        setIsSaved(true);
        if (onSave) onSave(values);
      } else {
        message.error('ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
        onFinish={handleSubmit}
        requiredMark="optional"
      >
        <Form.Item
          name="learningOutcome"
          label={<><StarOutlined /> สรุปสิ่งที่ได้เรียนรู้จากการฝึกงาน</>}
          rules={[
            { required: true, message: 'กรุณากรอกสรุปสิ่งที่ได้เรียนรู้' },
          ]}
        >
          <TextArea 
            placeholder="อธิบายภาพรวมของสิ่งที่ได้เรียนรู้จากการฝึกงาน เช่น หน้าที่ความรับผิดชอบ ลักษณะงาน และสิ่งที่ได้ค้นพบระหว่างการฝึกงาน" 
            rows={6} 
            showCount 
            maxLength={200}
          />
        </Form.Item>
        
        <Form.Item
          name="keyLearnings"
          label={<><BulbOutlined /> ประสบการณ์และทักษะสำคัญที่ได้รับ</>}
          rules={[
            { required: true, message: 'กรุณากรอกประสบการณ์และทักษะสำคัญ' },
          ]}
        >
          <TextArea 
            placeholder="ระบุทักษะและประสบการณ์สำคัญที่ได้รับจากการฝึกงาน เช่น ทักษะทางเทคนิค ทักษะการทำงานร่วมกับผู้อื่น" 
            rows={4} 
            showCount 
            maxLength={200}
          />
        </Form.Item>
        
        <Form.Item
          name="futureApplication"
          label={<><BookOutlined /> การนำไปประยุกต์ใช้ในอนาคต</>}
          rules={[
            { required: true, message: 'กรุณากรอกการนำไปประยุกต์ใช้' },
          ]}
        >
          <TextArea 
            placeholder="อธิบายว่าจะนำประสบการณ์และความรู้ที่ได้รับไปประยุกต์ใช้ในการเรียนหรือการทำงานในอนาคตอย่างไร" 
            rows={4} 
            showCount 
            maxLength={200}
          />
        </Form.Item>
        
        <Form.Item
          name="improvements"
          label={<><ToolOutlined /> สิ่งที่ควรปรับปรุงและพัฒนา</>}
        >
          <TextArea 
            placeholder="ระบุสิ่งที่คุณคิดว่าควรปรับปรุงหรือพัฒนาเพิ่มเติม เพื่อเพิ่มประสิทธิภาพในการทำงาน (ถ้ามี)" 
            rows={3} 
            showCount 
            maxLength={200}
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />} 
            loading={loading}
          >
            บันทึกบทสรุป
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ReflectionForm;