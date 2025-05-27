# การปรับปรุง EmailApprovalController เป็น Service Layer Architecture

## สรุปการดำเนินการ

การปรับปรุงนี้เป็นการแยก business logic ออกจาก controller ไปเป็น service layer เพื่อให้สอดคล้องกับ architecture ที่ใช้ในระบบ CSLogbook

### ไฟล์ที่สร้างใหม่

#### 1. `backend/services/emailApprovalService.js`
**Service layer ใหม่** ที่รวม business logic ทั้งหมดสำหรับ email approval workflow:

**Methods หลัก:**
- `getApprovalHistory(studentId)` - ดึงประวัติการส่งคำขออนุมัติ
- `getTokenInfo(token)` - ดึงข้อมูลพื้นฐานของ token และชื่อนักศึกษา
- `getTimesheetEntriesForApproval(studentId, type, options)` - ดึงข้อมูลบันทึกการฝึกงานตามเงื่อนไข
- `generateApprovalTokens(logIds, studentId, supervisorEmail, type, transaction)` - สร้าง tokens สำหรับอนุมัติ/ปฏิเสธ
- `sendApprovalRequest(studentId, approvalData)` - ส่งคำขออนุมัติผ่านอีเมล
- `approveTimesheetEntries(token, comment)` - อนุมัติบันทึกการฝึกงาน
- `rejectTimesheetEntries(token, comment)` - ปฏิเสธบันทึกการฝึกงาน

**คุณสมบัติสำคัญ:**
- Transaction management ที่ปลอดภัย
- Comprehensive error handling และ logging
- Data validation และ business rules
- Structured return data สำหรับ controller

### ไฟล์ที่ปรับปรุง

#### 1. `backend/controllers/logbooks/emailApprovalController.js`
**ปรับปรุงทั้ง 4 functions หลัก:**

**BEFORE (Controller with Business Logic):**
```javascript
exports.sendApprovalRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 200+ บรรทัดของ business logic
    // - ตรวจสอบข้อมูลนักศึกษา
    // - ดึงข้อมูล internship document
    // - ค้นหาบันทึกการฝึกงาน
    // - สร้าง approval tokens
    // - ส่งอีเมล
    // - จัดการ transaction
  } catch (error) {
    await transaction.rollback();
    // error handling
  }
};
```

**AFTER (Controller as HTTP Layer):**
```javascript
exports.sendApprovalRequest = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type, startDate, endDate, logIds } = req.body;
    
    const approvalData = { type, startDate, endDate, logIds };
    const result = await emailApprovalService.sendApprovalRequest(studentId, approvalData);

    return res.status(200).json({
      success: true,
      message: 'ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างานเรียบร้อยแล้ว',
      data: result
    });
  } catch (error) {
    logger.error('Send Email Approval Request Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการส่งคำขออนุมัติผ่านอีเมล'
    });
  }
};
```

**ปรับปรุงทั้ง 4 functions:**
- `sendApprovalRequest` - ลดจาก ~200 บรรทัด เหลือ ~20 บรรทัด
- `approveTimeSheetViaEmail` - ลดจาก ~100 บรรทัด เหลือ ~40 บรรทัด (เก็บ HTML response)
- `rejectTimeSheetViaEmail` - ลดจาก ~150 บรรทัด เหลือ ~60 บรรทัด (เก็บ HTML forms/response)
- `getApprovalHistory` - ลดจาก ~40 บรรทัด เหลือ ~15 บรรทัด

#### 2. `backend/models/ApprovalToken.js`
**แก้ไข association เพื่อรองรับ includes:**
```javascript
// BEFORE
this.belongsTo(models.Student, {
    foreignKey: 'studentId',
    as: 'student'
});

// AFTER
this.belongsTo(models.Student, {
    foreignKey: 'studentId',
    targetKey: 'studentCode', // เชื่อมผ่าน studentCode แทน primary key
    as: 'student'
});
```

### การปรับปรุงด้าน Architecture

#### 1. **Separation of Concerns**
- **Controller Layer**: จัดการ HTTP requests/responses และ HTML rendering เท่านั้น
- **Service Layer**: รับผิดชอบ business logic, data validation, และ transaction management
- **Model Layer**: data access และ ORM relationships

#### 2. **Error Handling**
- **Service**: โยน meaningful errors พร้อม descriptive messages
- **Controller**: จัดการ HTTP status codes และ response formats
- **Logging**: ใช้ logger แทน console.log/error

#### 3. **Transaction Management**
- **Service**: จัดการ database transactions อย่างปลอดภัย
- **Controller**: ไม่ต้องกังวลเรื่อง transaction lifecycle

#### 4. **Code Reusability**
- Service methods สามารถนำไปใช้ใน controllers อื่นได้
- ง่ายต่อการเขียน unit tests
- ลดการ duplicate code

### ผลลัพธ์

#### **ประสิทธิภาพ:**
- Controller มีขนาดเล็กลง โฟกัสที่ HTTP layer
- Service layer มี comprehensive business logic
- การจัดการ errors ดีขึ้น

#### **Maintainability:**
- แยก concerns ชัดเจน
- ง่ายต่อการ debug และ maintenance
- Code structure สอดคล้องกับ service layer architecture ของระบบ

#### **Testability:**
- Service methods สามารถ test แยกได้
- Mock dependencies ง่ายขึ้น
- Unit tests มีประสิทธิภาพดีขึ้น

## Files Modified

1. **NEW**: `backend/services/emailApprovalService.js`
2. **UPDATED**: `backend/controllers/logbooks/emailApprovalController.js`
3. **UPDATED**: `backend/models/ApprovalToken.js`

## Notes

- HTML templates สำหรับ approval/rejection pages ยังคงอยู่ใน controller เพราะเป็นส่วนของ HTTP response
- Email sending ใช้ existing `mailer.js` utilities
- Database associations ได้รับการปรับปรุงเพื่อรองรับ service layer queries
- Error messages และ logging ได้รับการปรับปรุงให้สม่ำเสมอ

การปรับปรุงนี้ทำให้ emailApprovalController สอดคล้องกับ service layer architecture ที่ใช้ในระบบ CSLogbook อย่างสมบูรณ์
