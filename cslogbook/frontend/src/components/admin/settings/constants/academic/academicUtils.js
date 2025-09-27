import dayjs from '../../../../../utils/dayjs';
import { Tag, message } from 'antd';
import { DATE_FORMAT_MEDIUM } from "../../../../../utils/constants";

// แก้ไขฟังก์ชัน checkDateOverlap เพื่อให้ตรวจสอบทั้งสองช่วงเวลา
export const checkDateOverlap = (values) => {
  const inRange = (d, start, end) => (
    (d.isAfter(dayjs(start)) && d.isBefore(dayjs(end))) ||
    d.isSame(dayjs(start), 'day') ||
    d.isSame(dayjs(end), 'day')
  );
  // ตรวจสอบช่วงเวลาภาคเรียน
  const sem1Start = values.semester1Range?.[0];
  const sem1End = values.semester1Range?.[1];
  const sem2Start = values.semester2Range?.[0];
  const sem2End = values.semester2Range?.[1];
  const sem3Start = values.semester3Range?.[0];
  const sem3End = values.semester3Range?.[1];

  // 1. การทับซ้อนของภาคเรียน
  if (
    sem1Start && sem1End && sem2Start && sem2End &&
    dayjs(sem1End).isAfter(dayjs(sem2Start))
  ) {
    message.warning("ช่วงเวลาภาคเรียนที่ 1 และ 2 ทับซ้อนกัน");
    return false;
  }

  if (
    sem2Start && sem2End && sem3Start && sem3End &&
    dayjs(sem2End).isAfter(dayjs(sem3Start))
  ) {
    message.warning("ช่วงเวลาภาคเรียนที่ 2 และภาคฤดูร้อนทับซ้อนกัน");
    return false;
  }

  // แปลงวันที่ลงทะเบียนเป็น dayjs objects
  const internRegStart = values.internshipRegistrationOpenDate
    ? dayjs(values.internshipRegistrationOpenDate)
    : null;
  const internRegEnd = values.internshipRegistrationCloseDate
    ? dayjs(values.internshipRegistrationCloseDate)
    : null;
  const projectRegStart = values.projectRegistrationOpenDate
    ? dayjs(values.projectRegistrationOpenDate)
    : null;
  const projectRegEnd = values.projectRegistrationCloseDate
    ? dayjs(values.projectRegistrationCloseDate)
    : null;

  // 2. ตรวจสอบช่วงวันลงทะเบียนฝึกงาน
  if (internRegStart && internRegEnd) {
    if (internRegStart.isAfter(internRegEnd)) {
      message.warning("ช่วงวันลงทะเบียนฝึกงาน: วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด");
      return false;
    }
    const isInternRegStartInSemester =
      (sem1Start && sem1End && inRange(internRegStart, sem1Start, sem1End)) ||
      (sem2Start && sem2End && inRange(internRegStart, sem2Start, sem2End)) ||
      (sem3Start && sem3End && inRange(internRegStart, sem3Start, sem3End));

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
      (sem1Start && sem1End && inRange(projectRegStart, sem1Start, sem1End)) ||
      (sem2Start && sem2End && inRange(projectRegStart, sem2Start, sem2End)) ||
      (sem3Start && sem3End && inRange(projectRegStart, sem3Start, sem3End));

    if (!isProjectRegStartInSemester) {
      message.warning("วันเริ่มต้นลงทะเบียนโครงงานไม่อยู่ในช่วงเปิดภาคเรียนใดเลย");
      return false;
    }
  }

  // 4. ตรวจสอบการทับซ้อนระหว่างช่วงลงทะเบียนฝึกงานและโครงงาน
  if (internRegStart && internRegEnd && projectRegStart && projectRegEnd) {
  const latestStart = dayjs.max(internRegStart, projectRegStart);
  const earliestEnd = dayjs.min(internRegEnd, projectRegEnd);

    if (latestStart.isBefore(earliestEnd)) {
      message.warning("ช่วงเวลาลงทะเบียนฝึกงานและโครงงานทับซ้อนกัน");
      return false;
    }
  }

  return true;
};

// แก้ไขฟังก์ชันตัวแสดงสถานะภาคเรียนปัจจุบัน
export const getCurrentSemesterStatus = (formInstance) => {
  const today = dayjs();
  const sem1Range = formInstance.getFieldValue("semester1Range");
  const sem2Range = formInstance.getFieldValue("semester2Range");
  const sem3Range = formInstance.getFieldValue("semester3Range");

  if (
    sem1Range &&
    sem1Range[0] &&
    sem1Range[1] &&
  ((today.isAfter(dayjs(sem1Range[0])) && today.isBefore(dayjs(sem1Range[1]))) || today.isSame(dayjs(sem1Range[0]), 'day') || today.isSame(dayjs(sem1Range[1]), 'day'))
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคเรียนที่ 1</Tag>;
  } else if (
    sem2Range &&
  ((today.isAfter(dayjs(sem2Range[0])) && today.isBefore(dayjs(sem2Range[1]))) || today.isSame(dayjs(sem2Range[0]), 'day') || today.isSame(dayjs(sem2Range[1]), 'day'))
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคเรียนที่ 2</Tag>;
  } else if (
    sem3Range &&
  ((today.isAfter(dayjs(sem3Range[0])) && today.isBefore(dayjs(sem3Range[1]))) || today.isSame(dayjs(sem3Range[0]), 'day') || today.isSame(dayjs(sem3Range[1]), 'day'))
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคฤดูร้อน</Tag>;
  }

  return <Tag color="orange">ไม่อยู่ในช่วงเปิดภาคเรียน</Tag>;
};

// แยกฟังก์ชันตรวจสอบสถานะการลงทะเบียนเป็นสองฟังก์ชัน
export const getInternshipRegistrationStatus = (formInstance) => {
  const today = dayjs();
  const regStart = formInstance.getFieldValue(
    "internshipRegistrationOpenDate"
  );
  const regEnd = formInstance.getFieldValue("internshipRegistrationCloseDate");

  if (regStart && regEnd) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนฝึกงาน (เริ่ม{" "}
          {dayjs(regStart).format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนฝึกงานแล้ว (สิ้นสุด{" "}
          {dayjs(regEnd).format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนฝึกงาน (ถึง{" "}
          {dayjs(regEnd).format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    }
  }

  return <Tag color="gray">ไม่ได้กำหนดช่วงเวลาลงทะเบียนฝึกงาน</Tag>;
};

export const getProjectRegistrationStatus = (formInstance) => {
  const today = dayjs();
  const regStart = formInstance.getFieldValue("projectRegistrationOpenDate");
  const regEnd = formInstance.getFieldValue("projectRegistrationCloseDate");

  if (regStart && regEnd) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนโครงงานพิเศษ (เริ่ม{" "}
          {dayjs(regStart).format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนโครงงานแล้ว (สิ้นสุด{" "}
          {dayjs(regEnd).format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนโครงงาน (ถึง{" "}
          {dayjs(regEnd).format(DATE_FORMAT_MEDIUM)})
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

  const today = dayjs();
  const projectRegEnd = formInstance.getFieldValue("projectRegistrationCloseDate");

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
        dayjs(data.semester1Range.start, "YYYY-MM-DD"),
        dayjs(data.semester1Range.end, "YYYY-MM-DD"),
            ]
          : null,
        semester2Range: data.semester2Range
          ? [
        dayjs(data.semester2Range.start, "YYYY-MM-DD"),
        dayjs(data.semester2Range.end, "YYYY-MM-DD"),
            ]
          : null,
        semester3Range: data.semester3Range
          ? [
        dayjs(data.semester3Range.start, "YYYY-MM-DD"),
        dayjs(data.semester3Range.end, "YYYY-MM-DD"),
            ]
          : null,
        internshipRegistrationOpenDate: data.internshipRegistration?.startDate
          ? dayjs(data.internshipRegistration.startDate)
          : null,
        internshipRegistrationCloseDate: data.internshipRegistration?.endDate
          ? dayjs(data.internshipRegistration.endDate)
          : null,
        projectRegistrationOpenDate: data.projectRegistration?.startDate
          ? dayjs(data.projectRegistration.startDate)
          : null,
        projectRegistrationCloseDate: data.projectRegistration?.endDate
          ? dayjs(data.projectRegistration.endDate)
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
  academicYear: values.currentAcademicYear,
    currentSemester: values.currentSemester,
    semesters: {
      1: {
        range: values.semester1Range
          ? {
        start: dayjs(values.semester1Range[0]).format("YYYY-MM-DD"),
        end: dayjs(values.semester1Range[1]).format("YYYY-MM-DD"),
            }
          : null,
      },
      2: {
        range: values.semester2Range
          ? {
        start: dayjs(values.semester2Range[0]).format("YYYY-MM-DD"),
        end: dayjs(values.semester2Range[1]).format("YYYY-MM-DD"),
            }
          : null,
      },
      3: {
        range: values.semester3Range
          ? {
        start: dayjs(values.semester3Range[0]).format("YYYY-MM-DD"),
        end: dayjs(values.semester3Range[1]).format("YYYY-MM-DD"),
            }
          : null,
      },
    },
    internshipRegistration: {
      startDate: values.internshipRegistrationOpenDate
        ? dayjs(values.internshipRegistrationOpenDate).format("YYYY-MM-DD")
        : null,
      endDate: values.internshipRegistrationCloseDate
        ? dayjs(values.internshipRegistrationCloseDate).format("YYYY-MM-DD")
        : null,
    },
    projectRegistration: {
      startDate: values.projectRegistrationOpenDate
        ? dayjs(values.projectRegistrationOpenDate).format("YYYY-MM-DD")
        : null,
      endDate: values.projectRegistrationCloseDate
        ? dayjs(values.projectRegistrationCloseDate).format("YYYY-MM-DD")
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