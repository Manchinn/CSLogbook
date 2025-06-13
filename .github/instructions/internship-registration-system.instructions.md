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
└── StudentInfoSection.js            # แสดงข้อมูลนักศึกษา
```

### โครงสร้างเพิ่มเติม
```
cslogbook/frontend/src/components/internship/common/
├── TranscriptUpload.js              # คอมโพเนนต์สำหรับอัปโหลดไฟล์ transcript
└── StatusBadge.js                   # แสดงสถานะคำร้อง
```

## โครงสร้างแบบฟอร์ม คพ.05 (อัปเดต)

### ลำดับการกรอกข้อมูล
แบบฟอร์ม คพ.05 ได้รับการออกแบบให้กรอกข้อมูลตามลำดับดังนี้:

1. **ส่วนข้อมูลบริษัท/หน่วยงาน**
   - ชื่อบริษัท/หน่วยงาน
   - สถานที่ตั้ง
   - เรียนถึง (ชื่อผู้ติดต่อ/HR)
   - ตำแหน่ง (ของผู้ติดต่อ)

2. **ส่วนข้อมูลนักศึกษา**
   - ตัวเลือกฝึกงาน 1 คนหรือ 2 คน
   - ข้อมูลนักศึกษาคนที่ 1
     - ชื่อ-นามสกุล
     - ชั้นปี
     - ห้อง (RA, RB, RC, DA, DB, CSB)
     - รหัสประจำตัวนักศึกษา
     - เบอร์โทรศัพท์
     - หน่วยกิตสะสมทั้งหมด
   - (ถ้าเลือก 2 คน) ข้อมูลนักศึกษาคนที่ 2

3. **ส่วนช่วงเวลาฝึกงาน**
   - วันที่เริ่มต้นและสิ้นสุดการฝึกงาน (ไม่น้อยกว่า 60 วัน)

4. **ส่วนรายละเอียดตำแหน่งงาน**
   - ตำแหน่งฝึกงาน
   - ลักษณะงานที่จะได้รับมอบหมาย (ถ้ามี)
   - ข้อกำหนดอื่นๆ จากบริษัท (ถ้ามี)

5. **อัปโหลด Transcript**
   - ใบแสดงผลการเรียน (เฉพาะไฟล์ PDF)
   - ต้องแสดงหน่วยกิตสะสมไม่น้อยกว่า 81 หน่วยกิต

## คอมโพเนนต์ TranscriptUpload (เพิ่มใหม่)

คอมโพเนนต์สำหรับจัดการการอัปโหลดไฟล์ transcript ที่ถูกต้อง:

```javascript
// filepath: cslogbook/frontend/src/components/internship/common/TranscriptUpload.js
import React from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const TranscriptUpload = ({ value, onChange, disabled }) => {
  const beforeUpload = (file) => {
    const isPDF = file.type === 'application/pdf';
    if (!isPDF) {
      message.error('สามารถอัปโหลดไฟล์ PDF เท่านั้น');
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('ไฟล์ต้องมีขนาดไม่เกิน 10MB');
    }
    
    return isPDF && isLt10M;
  };

  const handleChange = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} อัปโหลดสำเร็จ`);
      onChange(info.file.originFileObj);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} อัปโหลดไม่สำเร็จ`);
    } else if (info.file.status === 'removed') {
      onChange(null);
    }
  };

  const uploadProps = {
    name: 'transcript',
    maxCount: 1,
    accept: '.pdf',
    showUploadList: true,
    beforeUpload,
    onChange: handleChange,
    customRequest: ({ onSuccess }) => setTimeout(() => onSuccess('ok'), 0),
    fileList: value ? [{ 
      uid: '-1', 
      name: value.name || 'transcript.pdf', 
      status: 'done' 
    }] : []
  };

  return (
    <Upload {...uploadProps} disabled={disabled}>
      <Button icon={<UploadOutlined />} disabled={disabled || value}>
        อัปโหลด Transcript (PDF)
      </Button>
    </Upload>
  );
};

export default TranscriptUpload;
```

## การแก้ไข InternshipRegistrationFlow.js

อัปเดตในส่วน `handleSubmit` และการจัดเก็บข้อมูลใน localStorage:

```javascript
// ฟังก์ชันส่งข้อมูล
const handleSubmit = async (finalData) => {
  try {
    setLoading(true);
    
    // เช็คว่า finalData.transcriptFile เป็นไฟล์ PDF จริงๆ หรือไม่
    let pdfFileToUpload = null;
    let isPDF = false;
    
    if (finalData.transcriptFile instanceof File) {
      pdfFileToUpload = finalData.transcriptFile;
      isPDF = pdfFileToUpload.type === 'application/pdf';
    } else if (finalData.transcriptFile?.originFileObj) {
      pdfFileToUpload = finalData.transcriptFile.originFileObj;
      isPDF = pdfFileToUpload.type === 'application/pdf';
    }
    
    if (!pdfFileToUpload || !isPDF) {
      message.error('กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น');
      setLoading(false);
      return;
    }
    
    // สร้าง FormData สำหรับส่งข้อมูลพร้อมไฟล์
    const formData = new FormData();
    
    // สร้างข้อมูล JSON สำหรับส่งไปยัง API
    const submitData = {
      documentType: 'internship',
      documentName: 'CS05',
      category: 'proposal',
      studentId: studentData.studentId,
      fullName: studentData.fullName,
      year: studentData.year,
      totalCredits: studentData.totalCredits,
      companyName: finalData.companyName,
      companyAddress: finalData.companyAddress,
      startDate: finalData.startDate,
      endDate: finalData.endDate,
      contactPerson: finalData.contactPerson,
      contactPosition: finalData.contactPosition,
      hasTwoStudents: finalData.hasTwoStudents || false,
      studentData: finalData.studentData || [],
      // เพิ่มข้อมูลห้องเรียนและเบอร์โทรศัพท์
      classroom: finalData.classroom || finalData.studentData?.[0]?.classroom || '',
      phoneNumber: finalData.phoneNumber || finalData.studentData?.[0]?.phoneNumber || ''
    };
    
    // แนบข้อมูล JSON
    formData.append('formData', JSON.stringify(submitData));
    
    // แนบไฟล์ transcript
    formData.append('transcript', pdfFileToUpload);

    // ส่งข้อมูลไปยัง backend
    const response = await internshipService.submitCS05WithTranscript(formData);

    if (response.success) {
      message.success('ส่งคำร้อง คพ.05 เรียบร้อยแล้ว');
      setExistingCS05(response.data);
      setIsSubmitted(true);
      setFormSubmitted(true); // เพิ่มบรรทัดนี้
      setCurrentStep(2); // ไปยังหน้า SubmissionResultStep
      
      // บันทึกข้อมูลลงใน localStorage เพื่อให้กลับมาดูได้ในภายหลัง
      localStorage.setItem('cs05_submitted', 'true');
      localStorage.setItem('cs05_data', JSON.stringify(response.data));
      localStorage.setItem('cs05_submission_date', new Date().toISOString());
    } else {
      throw new Error(response.message || 'ไม่สามารถส่งคำร้องได้');
    }
  } catch (error) {
    console.error('Submit error:', error);
    message.error(error.message || 'เกิดข้อผิดพลาดในการส่งคำร้อง');
  } finally {
    setLoading(false);
  }
};
```

## ปรับปรุงหน้า SubmissionResultStep

เพิ่มการแสดงผลข้อมูลห้องเรียนและเบอร์โทรศัพท์:

```javascript
// แสดงข้อมูลห้องและเบอร์โทรศัพท์
{(displayData.studentData?.[0]?.classroom || displayData.classroom || displayData.studentData?.[0]?.phoneNumber || displayData.phoneNumber) && (
  <>
    <Divider style={{ margin: "12px 0" }} />
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <div>
          <Text strong>ห้อง: </Text>
          <Text>{displayData.studentData?.[0]?.classroom || displayData.classroom || '-'}</Text>
        </div>
      </Col>
      <Col xs={24} md={12}>
        <div>
          <Text strong>เบอร์โทรศัพท์: </Text>
          <Text>{displayData.studentData?.[0]?.phoneNumber || displayData.phoneNumber || '-'}</Text>
        </div>
      </Col>
    </Row>
  </>
)}
```

## เพิ่มการเก็บและโหลดข้อมูลจาก localStorage

สำหรับการกลับมาดูข้อมูลภายหลัง:

```javascript
// ใน InternshipRegistrationFlow.js
useEffect(() => {
  // ตรวจสอบว่าเคยส่งฟอร์มแล้วหรือไม่
  const isSubmitted = localStorage.getItem('cs05_submitted') === 'true';
  const savedCS05Data = localStorage.getItem('cs05_data');
  
  if (isSubmitted && savedCS05Data) {
    try {
      const parsedData = JSON.parse(savedCS05Data);
      setExistingCS05(parsedData);
      setIsSubmitted(true);
      setFormSubmitted(true);
      
      // ถ้ามีการระบุใน URL ว่าต้องการดูผลการส่ง
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'result') {
        setCurrentStep(2); // ไปที่หน้า SubmissionResultStep
      }
    } catch (error) {
      console.error('Error parsing saved CS05 data:', error);
    }
  }
}, []);
```

## คำนวณระยะเวลาฝึกงาน

ฟังก์ชันสำหรับคำนวณระยะเวลาฝึกงานในรูปแบบวันและเดือน:

```javascript
const calculateInternshipDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const diffInDays = end.diff(start, 'day') + 1;
  const diffInMonths = Math.round(diffInDays / 30);
  
  return `${diffInMonths} เดือน (${diffInDays} วัน)`;
};
```

## โครงสร้างข้อมูล Student ที่อัปเดต

รองรับข้อมูลห้องเรียนและเบอร์โทรศัพท์:

```javascript
// โครงสร้างข้อมูล Student
{
  fullName: 'ชื่อ นามสกุล', // ชื่อ-นามสกุลนักศึกษา
  studentId: '64xxxxxxxx', // รหัสนักศึกษา
  yearLevel: 3,            // ชั้นปี
  classroom: 'RC',         // ห้อง (RA, RB, RC, DA, DB, CSB)
  phoneNumber: '09xxxxxxxx', // เบอร์โทรศัพท์
  totalCredits: 100        // หน่วยกิตสะสม
}
```

## การแสดงผลใน ReviewDataStep

เพิ่มการแสดงผลห้องเรียนและเบอร์โทรศัพท์:

```javascript
<Row gutter={16}>
  <Col span={12}>
    <div><Text>ชื่อ-นามสกุล:</Text> {formData.studentData?.[0]?.fullName || studentData?.fullName}</div>
    <div><Text>รหัสนักศึกษา:</Text> {formData.studentData?.[0]?.studentId || studentData?.studentId}</div>
    <div><Text>ชั้นปี:</Text> {formData.studentData?.[0]?.yearLevel || studentData?.year}</div>
  </Col>
  <Col span={12}>
    <div><Text>ห้อง:</Text> {formData.studentData?.[0]?.classroom || '-'}</div>
    <div><Text>เบอร์โทรศัพท์:</Text> {formData.studentData?.[0]?.phoneNumber || '-'}</div>
    <div><Text>หน่วยกิตสะสม:</Text> {formData.studentData?.[0]?.totalCredits || studentData?.totalCredits} หน่วยกิต</div>
  </Col>
</Row>
```

## โค้ดการแก้ไขปัญหาใน Backend

การตรวจสอบไฟล์ PDF ในฝั่ง Backend:

```javascript
// filepath: cslogbook/backend/controllers/documents/internshipController.js
exports.submitCS05WithTranscript = async (req, res) => {
  try {
    // แก้ไขลำดับพารามิเตอร์
    const result = await internshipManagementService.submitCS05WithTranscript(
      req.user.userId,
      req.file,   // ส่ง fileData เป็น req.file
      req.body.formData ? JSON.parse(req.body.formData) : req.body // ส่ง formData
    );
    
    return res.status(201).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error in submitCS05WithTranscript:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
};
```

## การดาวน์โหลดหนังสือขอความอนุเคราะห์

เพิ่มฟังก์ชันดาวน์โหลดหนังสือขอความอนุเคราะห์ในหน้า SubmissionResultStep (เมื่อคำร้องได้รับการอนุมัติ):

```javascript
const handleDownloadLetter = () => {
  if (!existingCS05 || existingCS05.status !== 'approved') {
    message.info('หนังสือขอความอนุเคราะห์ยังไม่พร้อมให้ดาวน์โหลด');
    return;
  }
  
  // ดาวน์โหลดหนังสือ
  window.open(`${process.env.REACT_APP_API_URL}/api/internship/letters/${existingCS05.letterId}`, '_blank');
};

// ใช้งานปุ่ม
<Button 
  type="primary" 
  icon={<DownloadOutlined />}
  onClick={handleDownloadLetter}
  disabled={!existingCS05 || existingCS05.status !== 'approved'}
>
  ดาวน์โหลดหนังสือขอความอนุเคราะห์
</Button>
```

## Best Practices ในการส่งข้อมูล (อัปเดต)

```javascript
// วิธีที่แนะนำในการส่งข้อมูลพร้อมไฟล์
const handleFormSubmit = (values) => {
  // 1. ตรวจสอบไฟล์ transcript ก่อนส่ง
  if (!transcriptFile) {
    message.error('กรุณาอัปโหลดใบแสดงผลการเรียน (Transcript)');
    return;
  }
  
  if (transcriptFile instanceof File && transcriptFile.type !== 'application/pdf') {
    message.error('กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น');
    return;
  }
  
  // 2. เตรียมข้อมูล
  const submitData = {
    ...values,
    transcriptFile: transcriptFile
  };
  
  // 3. ส่งข้อมูลไปยัง parent component
  onSubmit(submitData);
};
```

## การประมวลผลข้อมูลฟอร์มก่อนส่ง

```javascript
// แปลงค่าวันที่จาก DatePicker เป็นรูปแบบที่ต้องการ
if (values.internshipDateRange && values.internshipDateRange.length === 2) {
  values.startDate = values.internshipDateRange[0].format('YYYY-MM-DD');
  values.endDate = values.internshipDateRange[1].format('YYYY-MM-DD');
}

// คำนวณระยะเวลาฝึกงาน
values.internshipDuration = calculateInternshipDays(values.internshipDateRange);
```

## ปุ่มกลับไปดูหน้าผลการส่งคำร้อง

```javascript
// เพิ่มในส่วน sidebar
{isSubmitted && currentStep !== 2 && (
  <Button 
    type="primary" 
    block 
    onClick={() => setCurrentStep(2)}
    style={{ marginTop: 16 }}
  >
    ดูผลการส่งคำร้องล่าสุด
  </Button>
)}
```


---

## Development Guidelines (อัปเดต)

- ตรวจสอบให้แน่ใจว่าการอัปโหลดไฟล์ทำงานถูกต้องในทุกสถานการณ์
- ทดสอบการทำงานของ localStorage สำหรับการบันทึกและโหลดข้อมูลคำร้อง
- ตรวจสอบการส่งข้อมูลฟอร์มพร้อมไฟล์ PDF ไปยัง backend
- ดูแลประสบการณ์ผู้ใช้หลังจากส่งฟอร์มเรียบร้อยแล้ว
- ตรวจสอบการแสดงผลระยะเวลาฝึกงานในทุกหน้า
- ทดสอบการแสดงผลข้อมูลห้องเรียนและเบอร์โทรศัพท์
```

---

**หมายเหตุ**: คำแนะนำนี้ได้รับการอัปเดตเพื่อรวมการแก้ไขและฟีเจอร์ใหม่ทั้งหมดที่เราได้พัฒนาในระบบลงทะเบียนฝึกงาน