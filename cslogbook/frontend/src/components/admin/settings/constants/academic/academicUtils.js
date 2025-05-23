import moment from 'moment';
import { Tag, message } from 'antd';
import { DATE_FORMAT_MEDIUM } from "../../../../../utils/constants";

// แก้ไขฟังก์ชัน checkDateOverlap เพื่อให้ตรวจสอบทั้งสองช่วงเวลา
export const checkDateOverlap = (values) => {
  // ตรวจสอบช่วงเวลาภาคเรียน
  const sem1Start = values.semester1Range?.[0];
  const sem1End = values.semester1Range?.[1];
  const sem2Start = values.semester2Range?.[0];
  const sem2End = values.semester2Range?.[1];
  const sem3Start = values.semester3Range?.[0];
  const sem3End = values.semester3Range?.[1];

  // 1. การทับซ้อนของภาคเรียน
  if (sem1Start && sem1End && sem2Start && sem2End && sem1End.isAfter(sem2Start)) {
    message.warning("ช่วงเวลาภาคเรียนที่ 1 และ 2 ทับซ้อนกัน");
    return false;
  }

  if (sem2Start && sem2End && sem3Start && sem3End && sem2End.isAfter(sem3Start)) {
    message.warning("ช่วงเวลาภาคเรียนที่ 2 และภาคฤดูร้อนทับซ้อนกัน");
    return false;
  }

  // แปลงวันที่ลงทะเบียนเป็น moment objects
  const internRegStart = values.internshipRegistrationStartDate
    ? moment(values.internshipRegistrationStartDate)
    : null;
  const internRegEnd = values.internshipRegistrationEndDate
    ? moment(values.internshipRegistrationEndDate)
    : null;
  const projectRegStart = values.projectRegistrationStartDate
    ? moment(values.projectRegistrationStartDate)
    : null;
  const projectRegEnd = values.projectRegistrationEndDate
    ? moment(values.projectRegistrationEndDate)
    : null;

  // 2. ตรวจสอบช่วงวันลงทะเบียนฝึกงาน
  if (internRegStart && internRegEnd) {
    if (internRegStart.isAfter(internRegEnd)) {
      message.warning("ช่วงวันลงทะเบียนฝึกงาน: วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด");
      return false;
    }
    const isInternRegStartInSemester =
      (sem1Start && sem1End && internRegStart.isBetween(sem1Start, sem1End, null, "[]")) ||
      (sem2Start && sem2End && internRegStart.isBetween(sem2Start, sem2End, null, "[]")) ||
      (sem3Start && sem3End && internRegStart.isBetween(sem3Start, sem3End, null, "[]"));

    if (!isInternRegStartInSemester) {
      message.warning("วันเริ่มต้นลงทะเบียนฝึกงานไม่อยู่ในช่วงเปิดภาคเรียนใดเลย");
      return false;
    }
  }

  // 3. ตรวจสอบช่วงวันลงทะเบียนโครงงาน
  if (projectRegStart && projectRegEnd) {
    if (projectRegStart.isAfter(projectRegEnd)) {
      message.warning("ช่วงวันลงทะเบียนโครงงาน: วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด");
      return false;
    }
    const isProjectRegStartInSemester =
      (sem1Start && sem1End && projectRegStart.isBetween(sem1Start, sem1End, null, "[]")) ||
      (sem2Start && sem2End && projectRegStart.isBetween(sem2Start, sem2End, null, "[]")) ||
      (sem3Start && sem3End && projectRegStart.isBetween(sem3Start, sem3End, null, "[]"));

    if (!isProjectRegStartInSemester) {
      message.warning("วันเริ่มต้นลงทะเบียนโครงงานไม่อยู่ในช่วงเปิดภาคเรียนใดเลย");
      return false;
    }
  }

  // 4. ตรวจสอบการทับซ้อนระหว่างช่วงลงทะเบียนฝึกงานและโครงงาน
  if (internRegStart && internRegEnd && projectRegStart && projectRegEnd) {
    const latestStart = moment.max(internRegStart, projectRegStart);
    const earliestEnd = moment.min(internRegEnd, projectRegEnd);

    if (latestStart.isBefore(earliestEnd)) {
      message.warning("ช่วงเวลาลงทะเบียนฝึกงานและโครงงานทับซ้อนกัน");
      return false;
    }
  }

  return true;
};

// แก้ไขฟังก์ชันตัวแสดงสถานะภาคเรียนปัจจุบัน
export const getCurrentSemesterStatus = (formInstance) => {
  const today = moment();
  const sem1Range = formInstance.getFieldValue("semester1Range");
  const sem2Range = formInstance.getFieldValue("semester2Range");
  const sem3Range = formInstance.getFieldValue("semester3Range");

  if (
    sem1Range &&
    sem1Range[0] &&
    sem1Range[1] &&
    today.isBetween(sem1Range[0], sem1Range[1], null, "[]")
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคเรียนที่ 1</Tag>;
  } else if (
    sem2Range &&
    today.isBetween(sem2Range[0], sem2Range[1], null, "[]")
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคเรียนที่ 2</Tag>;
  } else if (
    sem3Range &&
    today.isBetween(sem3Range[0], sem3Range[1], null, "[]")
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคฤดูร้อน</Tag>;
  }

  return <Tag color="orange">ไม่อยู่ในช่วงเปิดภาคเรียน</Tag>;
};

// แยกฟังก์ชันตรวจสอบสถานะการลงทะเบียนเป็นสองฟังก์ชัน
export const getInternshipRegistrationStatus = (formInstance) => {
  const today = moment();
  const regStart = formInstance.getFieldValue(
    "internshipRegistrationStartDate"
  );
  const regEnd = formInstance.getFieldValue("internshipRegistrationEndDate");

  if (
    regStart &&
    regEnd &&
    moment.isMoment(regStart) &&
    moment.isMoment(regEnd)
  ) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนฝึกงาน (เริ่ม{" "}
          {moment(regStart).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนฝึกงานแล้ว (สิ้นสุด{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนฝึกงาน (ถึง{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    }
  }

  return <Tag color="gray">ไม่ได้กำหนดช่วงเวลาลงทะเบียนฝึกงาน</Tag>;
};

export const getProjectRegistrationStatus = (formInstance) => {
  const today = moment();
  const regStart = formInstance.getFieldValue("projectRegistrationStartDate");
  const regEnd = formInstance.getFieldValue("projectRegistrationEndDate");

  if (
    regStart &&
    regEnd &&
    moment.isMoment(regStart) &&
    moment.isMoment(regEnd)
  ) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนโครงงานพิเศษ (เริ่ม{" "}
          {moment(regStart).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนโครงงานแล้ว (สิ้นสุด{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนโครงงาน (ถึง{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    }
  }

  return <Tag color="gray">ไม่ได้กำหนดช่วงเวลาลงทะเบียนโครงงาน</Tag>;
};

// เพิ่มฟังก์ชันตรวจสอบภาคเรียนที่ลงทะเบียนได้
export const isRegistrationOpenForSemester = (formInstance) => {
  const currentSemester = formInstance.getFieldValue("currentSemester");
  const internshipSemesters = formInstance.getFieldValue(
    "internshipSemesters"
  ) || [3];
  const projectSemesters = formInstance.getFieldValue("projectSemesters") || [
    1, 2,
  ];

  const today = moment();
  const projectRegEnd = formInstance.getFieldValue("projectRegistrationEndDate");

  return {
    internship: internshipSemesters.includes(currentSemester),
    project:
      projectSemesters.includes(currentSemester) &&
      (!projectRegEnd || today.isSameOrBefore(projectRegEnd)), // ตรวจสอบวันที่สิ้นสุด
  };
};

export const loadCurriculumsProcess = async (getCurriculumsService) => {
  try {
    const response = await getCurriculumsService();
    if (response && response.success && response.data) {
      const activeCurriculums = response.data.filter((c) => c.active);
      let initialSelectedCurriculumId = null;
      let warningMessage = null;

      if (activeCurriculums.length === 0) {
        warningMessage = "ไม่พบหลักสูตรที่เปิดใช้งาน กรุณาตั้งค่าในหน้าจัดการหลักสูตร";
      } else {
        initialSelectedCurriculumId = activeCurriculums[0].curriculumId;
      }
      
      return { 
        activeCurriculums, 
        initialSelectedCurriculumId, 
        warningMessage, 
        errorMessage: null 
      };
    }
    return { 
      activeCurriculums: [], 
      initialSelectedCurriculumId: null, 
      warningMessage: null, 
      errorMessage: "ไม่สามารถดึงข้อมูลหลักสูตรได้" 
    };
  } catch (err) {
    console.error("Error in loadCurriculumsProcess:", err);
    return { 
      activeCurriculums: [], 
      initialSelectedCurriculumId: null, 
      warningMessage: null, 
      errorMessage: "เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร" 
    };
  }
};

export const loadAcademicSettingsProcess = async (getAcademicSettingsService) => {
  try {
    const response = await getAcademicSettingsService();
    if (response && response.success && response.data) {
      const data = response.data;
      const formValues = {
        id: data.id,
        currentAcademicYear: data.academicYear,
        currentSemester: data.currentSemester,
        semester1Range: data.semester1Range
          ? [
              moment(data.semester1Range.start, "YYYY-MM-DD"),
              moment(data.semester1Range.end, "YYYY-MM-DD"),
            ]
          : null,
        semester2Range: data.semester2Range
          ? [
              moment(data.semester2Range.start, "YYYY-MM-DD"),
              moment(data.semester2Range.end, "YYYY-MM-DD"),
            ]
          : null,
        semester3Range: data.semester3Range
          ? [
              moment(data.semester3Range.start, "YYYY-MM-DD"),
              moment(data.semester3Range.end, "YYYY-MM-DD"),
            ]
          : null,
        internshipRegistrationStartDate: data.internshipRegistration?.startDate
          ? moment(data.internshipRegistration.startDate)
          : null,
        internshipRegistrationEndDate: data.internshipRegistration?.endDate
          ? moment(data.internshipRegistration.endDate)
          : null,
        projectRegistrationStartDate: data.projectRegistration?.startDate
          ? moment(data.projectRegistration.startDate)
          : null,
        projectRegistrationEndDate: data.projectRegistration?.endDate
          ? moment(data.projectRegistration.endDate)
          : null,
        internshipSemesters: data.internshipSemesters || [3],
        projectSemesters: data.projectSemesters || [1, 2],
        activeCurriculumId: data.activeCurriculumId || null,
        selectedCurriculum: data.activeCurriculumId || null,
      };
      return { formValues, errorMessage: null };
    }
    return { formValues: {}, errorMessage: "ไม่สามารถดึงข้อมูลการตั้งค่าได้" };
  } catch (err) {
    console.error("Error in loadAcademicSettingsProcess:", err);
    return { formValues: {}, errorMessage: "เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า" };
  }
};

const formatDataForSave = (formInstance, values) => {
  return {
    id: formInstance.getFieldValue("id"),
    currentAcademicYear: values.currentAcademicYear,
    currentSemester: values.currentSemester,
    semesters: {
      1: {
        range: values.semester1Range
          ? {
              start: values.semester1Range[0].format("YYYY-MM-DD"),
              end: values.semester1Range[1].format("YYYY-MM-DD"),
            }
          : null,
      },
      2: {
        range: values.semester2Range
          ? {
              start: values.semester2Range[0].format("YYYY-MM-DD"),
              end: values.semester2Range[1].format("YYYY-MM-DD"),
            }
          : null,
      },
      3: {
        range: values.semester3Range
          ? {
              start: values.semester3Range[0].format("YYYY-MM-DD"),
              end: values.semester3Range[1].format("YYYY-MM-DD"),
            }
          : null,
      },
    },
    internshipRegistration: {
      startDate: values.internshipRegistrationStartDate
        ? values.internshipRegistrationStartDate.format("YYYY-MM-DD")
        : null,
      endDate: values.internshipRegistrationEndDate
        ? values.internshipRegistrationEndDate.format("YYYY-MM-DD")
        : null,
    },
    projectRegistration: {
      startDate: values.projectRegistrationStartDate
        ? values.projectRegistrationStartDate.format("YYYY-MM-DD")
        : null,
      endDate: values.projectRegistrationEndDate
        ? values.projectRegistrationEndDate.format("YYYY-MM-DD")
        : null,
    },
    internshipSemesters: values.internshipSemesters || [3],
    projectSemesters: values.projectSemesters || [1, 2],
    activeCurriculumId: values.selectedCurriculum || null,
  };
};

export const saveAcademicSettingsProcess = async (
  updateAcademicSettingsService,
  formInstance,
  checkDateOverlapFunc
) => {
  try {
    const values = await formInstance.validateFields();

    if (!checkDateOverlapFunc(values)) {
      // The checkDateOverlapFunc (from antd message) should show its own message.
      return { success: false, statusMessage: "การตรวจสอบช่วงเวลาไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง" };
    }

    const formattedData = formatDataForSave(formInstance, values);
    const response = await updateAcademicSettingsService(formattedData);

    if (response && response.success) {
      return { success: true, statusMessage: "บันทึกการตั้งค่าสำเร็จ" };
    }
    return { success: false, statusMessage: (response && response.message) || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  } catch (err) {
    console.error("Error in saveAcademicSettingsProcess:", err);
    if (err.errorFields && err.errorFields.length > 0) {
        return { success: false, statusMessage: "ข้อมูลในฟอร์มไม่ถูกต้อง กรุณาตรวจสอบ" };
    }
    return { success: false, statusMessage: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
};