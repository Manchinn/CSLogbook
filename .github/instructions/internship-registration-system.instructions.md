---
applyTo: 'cslogbook/frontend/src/components/internship/**'
---
# CSLogbook - Internship Registration System Instructions

## ภาพรวมระบบลงทะเบียนฝึกงาน (Internship Registration System)

ระบบลงทะเบียนฝึกงานเป็นส่วนหนึ่งของ CSLogbook ที่ใช้สำหรับจัดการขั้นตอนการสมัครฝึกงานของนักศึกษา ตั้งแต่การกรอกแบบฟอร์ม คพ.05 จนถึงการติดตามสถานะการอนุมัติและเอกสารต่างๆ

## โครงสร้างไฟล์และคอมโพเนนต์

### โครงสร้างหลัก
```
cslogbook/frontend/src/components/internship/register/
├── index.js                         # Export ทุกคอมโพเนนต์
├── InternshipRegistrationFlow.js    # หน้าหลักควบคุมทั้งระบบ
├── CS05FormStep.js                  # ขั้นตอนกรอกฟอร์ม คพ.05
├── ReviewDataStep.js                # ขั้นตอนตรวจสอบข้อมูล
├── SubmissionResultStep.js          # ขั้นตอนผลการส่งคำร้อง
├── StudentInfoSection.js            # แสดงข้อมูลนักศึกษา
└── InternshipDocumentsPage.js       # หน้าเอกสารฝึกงาน
```

## ขั้นตอนการลงทะเบียนฝึกงาน (Registration Steps)

### 3 ขั้นตอนหลัก
```javascript
const registrationSteps = [
  {
    title: 'กรอกข้อมูล คพ.05',
    description: 'กรอกข้อมูลบริษัทและนักศึกษา',
    icon: <FormOutlined />,
    key: 'form'
  },
  {
    title: 'ตรวจสอบข้อมูล',
    description: 'ตรวจสอบความถูกต้องของข้อมูล',
    icon: <CheckCircleOutlined />,
    key: 'review'
  },
  {
    title: 'ส่งคำร้อง',
    description: 'ยืนยันและส่งคำร้องเข้าระบบ',
    icon: <SendOutlined />,
    key: 'result'
  }
];
```

## สถานะหลังส่งคำร้อง คพ.05 (Post-Submission Statuses)

### 12 สถานะตามลำดับ
```javascript
const internshipStatuses = [
  {
    value: 'draft',
    label: 'ร่าง (ยังไม่ส่ง)',
    description: 'ยังไม่ได้ส่งคำร้อง คพ.05',
    color: 'default',
    icon: <FileTextOutlined />,
    nextSteps: ['ตรวจสอบข้อมูลก่อนส่ง', 'แก้ไขข้อมูลหากจำเป็น']
  },
  {
    value: 'submitted',
    label: 'ส่งคำร้องแล้ว',
    description: 'ส่งคำร้อง คพ.05 เรียบร้อยแล้ว',
    color: 'processing',
    icon: <CheckCircleOutlined />,
    nextSteps: ['รอการตรวจสอบจากเจ้าหน้าที่', 'ประมาณ 3-5 วันทำการ']
  },
  {
    value: 'under_review',
    label: 'อยู่ระหว่างการตรวจสอบ',
    description: 'เจ้าหน้าที่ภาควิชากำลังตรวจสอบเอกสาร',
    color: 'warning',
    icon: <ClockCircleOutlined />,
    nextSteps: ['รอผลการพิจารณา', 'อาจต้องแก้ไขเอกสารเพิ่มเติม']
  },
  {
    value: 'revision_required',
    label: 'ต้องแก้ไขเอกสาร',
    description: 'มีข้อมูลที่ต้องปรับปรุงหรือแก้ไข',
    color: 'error',
    icon: <ExclamationCircleOutlined />,
    nextSteps: ['แก้ไขตามคำแนะนำ', 'ส่งเอกสารใหม่อีกครั้ง']
  },
  {
    value: 'approved',
    label: 'อนุมัติแล้ว',
    description: 'หนังสือขอความอนุเคราะห์พร้อมดาวน์โหลด',
    color: 'success',
    icon: <CheckCircleOutlined />,
    nextSteps: ['ดาวน์โหลดหนังสือขอความอนุเคราะห์', 'ติดต่อบริษัทเพื่อขอฝึกงาน']
  },
  {
    value: 'letter_downloaded',
    label: 'ดาวน์โหลดหนังสือแล้ว',
    description: 'ได้รับหนังสือขอความอนุเคราะห์แล้ว',
    color: 'cyan',
    icon: <DownloadOutlined />,
    nextSteps: ['นำหนังสือไปติดต่อบริษัท', 'รอหนังสือตอบรับจากบริษัท']
  },
  {
    value: 'company_contacted',
    label: 'ติดต่อบริษัทแล้ว',
    description: 'ได้นำหนังสือไปติดต่อบริษัทแล้ว',
    color: 'purple',
    icon: <SendOutlined />,
    nextSteps: ['รอการพิจารณาจากบริษัท', 'ติดตามผลการสมัคร']
  },
  {
    value: 'acceptance_received',
    label: 'ได้รับหนังสือตอบรับ',
    description: 'บริษัทตอบรับให้เข้าฝึกงาน',
    color: 'green',
    icon: <CheckCircleOutlined />,
    nextSteps: ['อัปโหลดหนังสือตอบรับ', 'รอหนังสือส่งตัว']
  },
  {
    value: 'acceptance_uploaded',
    label: 'อัปโหลดหนังสือตอบรับแล้ว',
    description: 'ส่งหนังสือตอบรับจากบริษัทแล้ว',
    color: 'lime',
    icon: <UploadOutlined />,
    nextSteps: ['รอการจัดทำหนังสือส่งตัว', 'ประมาณ 2-3 วันทำการ']
  },
  {
    value: 'referral_ready',
    label: 'หนังสือส่งตัวพร้อม',
    description: 'หนังสือส่งตัวพร้อมดาวน์โหลด',
    color: 'gold',
    icon: <FileTextOutlined />,
    nextSteps: ['ดาวน์โหลดหนังสือส่งตัว', 'เตรียมตัวเริ่มฝึกงาน']
  },
  {
    value: 'internship_started',
    label: 'เริ่มฝึกงานแล้ว',
    description: 'รายงานตัวและเริ่มฝึกงานแล้ว',
    color: 'volcano',
    icon: <PlayCircleOutlined />,
    nextSteps: ['ทำงานตามแผนฝึกงาน', 'บันทึกผลการฝึกงาน']
  },
  {
    value: 'completed',
    label: 'ฝึกงานเสร็จสิ้น',
    description: 'ฝึกงานเสร็จสิ้นเรียบร้อย',
    color: 'magenta',
    icon: <TrophyOutlined />,
    nextSteps: ['ส่งรายงานการฝึกงาน', 'ประเมินผลการฝึกงาน']
  }
];
```

## คอมโพเนนต์หลัก (Main Components)

### 1. InternshipRegistrationFlow.js
**หน้าที่**: คอมโพเนนต์หลักที่ควบคุมทั้งขั้นตอนการลงทะเบียนฝึกงาน

#### State Management
```javascript
// State สำคัญที่ต้องมี
const [currentStep, setCurrentStep] = useState(0);      // ขั้นตอนปัจจุบัน (0-2)
const [loading, setLoading] = useState(false);          // สถานะโหลด
const [studentData, setStudentData] = useState(null);   // ข้อมูลนักศึกษา
const [formData, setFormData] = useState({});           // ข้อมูลฟอร์ม คพ.05
```

#### ฟังก์ชันสำคัญ
```javascript
// ฟังก์ชันควบคุมขั้นตอน
const handleNextStep = () => {
  if (currentStep < registrationSteps.length - 1) {
    setCurrentStep(currentStep + 1);
  }
};

const handlePrevStep = () => {
  if (currentStep > 0) {
    setCurrentStep(currentStep - 1);
  }
};

// ฟังก์ชันส่งคำร้อง
const handleSubmit = async (finalData) => {
  try {
    setLoading(true);
    
    // ส่งข้อมูล
    const response = await internshipService.submitCS05WithTranscript(finalData);
    if (response.success) {
      setCurrentStep(2);
      message.success('ส่งคำร้อง คพ.05 เรียบร้อยแล้ว');
    }
  } catch (error) {
    message.error('เกิดข้อผิดพลาดในการส่งคำร้อง');
  } finally {
    setLoading(false);
  }
};
```

#### Layout Structure
```javascript
const InternshipRegistrationFlow = () => {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
      {/* หัวข้อหลัก */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={1}>🎓 ระบบฝึกงานนักศึกษา</Title>
        <Title level={4} type="secondary">
          {studentData?.fullName || 'ข้อมูลนักศึกษา'} - รหัส: {studentData?.studentCode || 'N/A'}
        </Title>
      </div>

      {/* Progress Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps 
          current={currentStep} 
          items={registrationSteps}
        />
      </Card>

      {/* Layout หลัก */}
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card className="internship-form">
            {getStepContent()}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          {/* Sidebar ข้อมูลเพิ่มเติม */}
          <Card title="ข้อมูลการฝึกงาน" size="small">
            {renderSidebarInfo()}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

## การจัดการ API และ Services

### Service Layer
```javascript
const internshipService = {
  // โหลดข้อมูลนักศึกษา
  getStudentProfile: async () => {
    try {
      const response = await apiClient.get('/api/students/profile');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลนักศึกษาได้'
      };
    }
  },

  // ส่งคำร้อง CS05
  submitCS05WithTranscript: async (formData) => {
    try {
      const response = await apiClient.post('/api/internship/cs05/submit', formData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถส่งคำร้องได้'
      };
    }
  },

  // โหลด CS05 ปัจจุบัน
  getCurrentCS05: async () => {
    try {
      const response = await apiClient.get('/api/internship/cs05/current');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'ไม่พบข้อมูล CS05'
      };
    }
  },

  // อัปเดตสถานะ
  updateCS05Status: async (cs05Id, status) => {
    try {
      const response = await apiClient.patch(`/api/internship/cs05/${cs05Id}/status`, { status });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'ไม่สามารถอัปเดตสถานะได้'
      };
    }
  }
};
```

## การใช้ Ant Design Components

### Components ที่ใช้บ่อย
```javascript
import { 
  Steps, Card, Typography, Alert, Space, message,
  Row, Col, Progress, Divider, Tag, Button, Select, Form,
  Input, DatePicker, Upload, Modal, Spin, Empty, Result,
  Timeline, Descriptions, Drawer, Popconfirm
} from 'antd';

import { 
  FormOutlined, CheckCircleOutlined, SendOutlined,
  PhoneOutlined, PlayCircleOutlined, SettingOutlined,
  FileTextOutlined, UploadOutlined, DownloadOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, TrophyOutlined
} from '@ant-design/icons';
```

### Form Validation Rules
```javascript
const formValidationRules = {
  companyName: [
    { required: true, message: 'กรุณากรอกชื่อบริษัท' },
    { min: 2, message: 'ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร' }
  ],
  companyAddress: [
    { required: true, message: 'กรุณากรอกที่อยู่บริษัท' },
    { min: 10, message: 'ที่อยู่ต้องมีรายละเอียดครบถ้วน' }
  ],
  internshipPosition: [
    { required: true, message: 'กรุณากรอกตำแหน่งฝึกงาน' }
  ],
  contactEmail: [
    { required: true, message: 'กรุณากรอกอีเมลติดต่อ' },
    { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
  ],
  contactPhone: [
    { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
    { pattern: /^[0-9-]{8,12}$/, message: 'รูปแบบเบอร์โทรไม่ถูกต้อง' }
  ],
  internshipDuration: [
    { required: true, message: 'กรุณาระบุระยะเวลาฝึกงาน' }
  ]
};
```

## State Management Patterns

### Local State (แนะนำสำหรับโปรเจคเล็ก)
```javascript
const InternshipRegistrationFlow = () => {
  // จัดการ state ภายใน component
  const [state, setState] = useState({
    currentStep: 0,
    loading: false,
    studentData: null,
    formData: {}
  });

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };
};
```

### Context API (สำหรับโปรเจคใหญ่)
```javascript
// สร้าง Context
const InternshipContext = createContext();

// Provider
export const InternshipProvider = ({ children }) => {
  const [state, dispatch] = useReducer(internshipReducer, initialState);
  
  const value = {
    state,
    dispatch,
    // Helper functions
    setCurrentStep: (step) => dispatch({ type: 'SET_CURRENT_STEP', payload: step }),
    setFormData: (data) => dispatch({ type: 'SET_FORM_DATA', payload: data }),
    setStudentData: (data) => dispatch({ type: 'SET_STUDENT_DATA', payload: data })
  };

  return (
    <InternshipContext.Provider value={value}>
      {children}
    </InternshipContext.Provider>
  );
};

// Custom Hook
export const useInternship = () => {
  const context = useContext(InternshipContext);
  if (!context) {
    throw new Error('useInternship ต้องใช้ภายใน InternshipProvider');
  }
  return context;
};
```

## การจัดการ Error และ Loading States

### Error Handling
```javascript
const handleAPICall = async (apiFunction, errorMessage = 'เกิดข้อผิดพลาด') => {
  try {
    setLoading(true);
    const result = await apiFunction();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('API Error:', error);
    message.error(error.message || errorMessage);
    return null;
  } finally {
    setLoading(false);
  }
};
```

### Loading States
```javascript
const LoadingWrapper = ({ loading, children }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>กำลังโหลด...</div>
      </div>
    );
  }
  return children;
};
```

## Responsive Design และ Styling

### Responsive Breakpoints
```javascript
const responsiveProps = {
  xs: 24,    // <576px
  sm: 24,    // ≥576px
  md: 12,    // ≥768px
  lg: 8,     // ≥992px
  xl: 6,     // ≥1200px
  xxl: 4     // ≥1600px
};

// Usage
<Col {...responsiveProps}>
  <Card>Content</Card>
</Col>
```

### Theme Colors
```javascript
const themeColors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#13c2c2',
  processing: '#1890ff',
  default: '#d9d9d9'
};
```

## Best Practices และ Code Standards

### Component Structure
```javascript
// 1. Imports
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, message } from 'antd';

// 2. Constants และ Config
const COMPONENT_NAME = 'InternshipComponent';
const DEFAULT_STATE = { loading: false };

// 3. Main Component
const InternshipComponent = ({ 
  // Props with TypeScript-style comments
  studentId,    // string: รหัสนักศึกษา
  onSubmit,     // function: ฟังก์ชันเมื่อส่งฟอร์ม
  ...props 
}) => {
  // 4. Hooks
  const [state, setState] = useState(DEFAULT_STATE);
  const [form] = Form.useForm();

  // 5. Event Handlers
  const handleSubmit = useCallback(async (values) => {
    // Implementation
  }, [onSubmit]);

  // 6. Effects
  useEffect(() => {
    // Side effects
  }, [studentId]);

  // 7. Render
  return (
    <Card>
      {/* JSX */}
    </Card>
  );
};

// 8. Export
export default InternshipComponent;
```

### Error Boundary
```javascript
class InternshipErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Internship Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="เกิดข้อผิดพลาดในระบบฝึกงาน"
          subTitle="กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่"
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              รีโหลดหน้า
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
```

## Development Guidelines
- เน้นการพัฒนาที่รองรับการใช้งานจริงและมีประสิทธิภาพ
- ตรวจสอบ responsive design ในทุกขนาดหน้าจอ
- ทดสอบการจัดการ error ในสถานการณ์ต่างๆ
- เขียนโค้ดให้มีความยืดหยุ่นและรองรับการขยายฟีเจอร์ในอนาคต

### Performance Optimization
```javascript
// 1. Memoization
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// 2. Lazy Loading
const LazyInternshipPage = React.lazy(() => 
  import('./InternshipDocumentsPage')
);

// 3. useCallback สำหรับ event handlers
const handleSubmit = useCallback((values) => {
  // Handler logic
}, [dependencies]);

// 4. useMemo สำหรับ computed values
const computedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);
```

## Integration Guidelines

### Router Integration
```javascript
import { Routes, Route, Navigate } from 'react-router-dom';

const InternshipRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/register" replace />} />
    <Route path="/register" element={<InternshipRegistrationFlow />} />
    <Route path="/documents" element={<InternshipDocumentsPage />} />
    <Route path="/status/:cs05Id" element={<StatusTrackingPage />} />
  </Routes>
);
```

### Authentication Integration
```javascript
const ProtectedInternshipRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Spin />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'student') {
    return <Result status="403" title="ไม่มีสิทธิ์เข้าถึง" />;
  }
  
  return children;
};
```

## คำแนะนำการใช้งาน

### สำหรับ Developer
1. ศึกษาโครงสร้างและการทำงานของระบบให้เข้าใจ
2. สร้าง Error Boundary สำหรับจัดการข้อผิดพลาด
3. ทดสอบ responsive design ในทุกขนาดหน้าจอ
4. ใช้ TypeScript comments สำหรับ prop types
5. เขียนโค้ดให้มีการจัดการ edge case ต่างๆ

### สำหรับ QA และ Testing
1. ทดสอบทุก status ของระบบ
2. ทดสอบการจัดการ error cases
3. ตรวจสอบ user experience ในแต่ละขั้นตอน
4. ทดสอบฟังก์ชันการทำงานในทุกขั้นตอน
5. ทดสอบการทำงานร่วมกับ API

### สำหรับ Product Owner
1. ตรวจสอบ user flow และ business logic
2. ทดสอบ edge cases ต่างๆ
3. รับฟีดแบ็กจาก stakeholders
4. วางแผน roadmap สำหรับฟีเจอร์เพิ่มเติม
5. ประเมินประสิทธิภาพการใช้งานจากมุมมองของผู้ใช้

---

**หมายเหตุ**: Instructions นี้ครอบคลุมการพัฒนาระบบลงทะเบียนฝึกงานที่สมบูรณ์ รวมถึงการจัดการ state, API integration และ error handling สามารถนำไปใช้เป็นแนวทางในการพัฒนาโปรเจคที่คล้ายกันได้