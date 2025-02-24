# การใช้งาน studentUtils.js

ไฟล์ `studentUtils.js` ประกอบด้วยฟังก์ชันที่ใช้ในการคำนวณชั้นปีของนักศึกษาและตรวจสอบสิทธิ์การฝึกงานและการทำโปรเจค

## ฟังก์ชัน calculateStudentYear

ฟังก์ชันนี้ใช้ในการคำนวณชั้นปีของนักศึกษาจากรหัสนักศึกษา

### ตัวอย่างการใช้งาน

```javascript
const { calculateStudentYear } = require('./studentUtils');

const studentID = '6012345678';
const studentYear = calculateStudentYear(studentID);
console.log(`ชั้นปีของนักศึกษา: ${studentYear}`);
```

## ฟังก์ชัน isEligibleForInternship

ฟังก์ชันนี้ใช้ในการตรวจสอบว่านักศึกษามีสิทธิ์ในการฝึกงานหรือไม่ โดยพิจารณาจากชั้นปีและหน่วยกิตรวม

### ตัวอย่างการใช้งาน

```javascript
const { isEligibleForInternship } = require('./studentUtils');

const studentYear = 3;
const totalCredits = 85;
const eligibleForInternship = isEligibleForInternship(studentYear, totalCredits);
console.log(`มีสิทธิ์ฝึกงาน: ${eligibleForInternship}`);
```

### ตัวอย่างการใช้งานในกรณีที่ไม่เข้าเงื่อนไข

```javascript
const { isEligibleForInternship } = require('./studentUtils');

const studentYear = 2;
const totalCredits = 60;
const eligibleForInternship = isEligibleForInternship(studentYear, totalCredits);
console.log(`มีสิทธิ์ฝึกงาน: ${eligibleForInternship}`); // ผลลัพธ์: มีสิทธิ์ฝึกงาน: false
```

## ฟังก์ชัน isEligibleForProject

ฟังก์ชันนี้ใช้ในการตรวจสอบว่านักศึกษามีสิทธิ์ในการทำโปรเจคหรือไม่ โดยพิจารณาจากชั้นปี หน่วยกิตรวม และหน่วยกิตภาควิชา

### ตัวอย่างการใช้งาน

```javascript
const { isEligibleForProject } = require('./studentUtils');

const studentYear = 4;
const totalCredits = 100;
const majorCredits = 50;
const eligibleForProject = isEligibleForProject(studentYear, totalCredits, majorCredits);
console.log(`มีสิทธิ์ทำโปรเจค: ${eligibleForProject}`);
```

### ตัวอย่างการใช้งานในกรณีที่ไม่เข้าเงื่อนไข

```javascript
const { isEligibleForProject } = require('./studentUtils');

const studentYear = 3;
const totalCredits = 90;
const majorCredits = 40;
const eligibleForProject = isEligibleForProject(studentYear, totalCredits, majorCredits);
console.log(`มีสิทธิ์ทำโปรเจค: ${eligibleForProject}`); // ผลลัพธ์: มีสิทธิ์ทำโปรเจค: false
```

## การนำเข้าโมดูล

ในการใช้งานฟังก์ชันเหล่านี้ คุณต้องนำเข้าโมดูล `studentUtils` ก่อน โดยใช้คำสั่ง `require`

```javascript
const { calculateStudentYear, isEligibleForInternship, isEligibleForProject } = require('./studentUtils');
```
