import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Badge,
  Space,
  Alert,
  Button,
  Spin,
  message,
} from "antd";
import { useParams } from "react-router-dom";
import { timelineService } from "../../../services/timelineService";
import { studentService } from "../../../services/studentService"; // เพิ่ม import studentService
import {
  isEligibleForInternship,
  isEligibleForProject,
} from "../../../utils/studentUtils";
import { DEFAULT_STUDENT_DATA, DEFAULT_PROGRESS_DATA } from "./helpers";
import NextAction from "./NextAction";
import Notifications from "./Notifications";
import EducationPath from "./EducationPath";
import InternshipSection from "./InternshipSection";
import ProjectSection from "./ProjectSection";
import StudyStatistics from "./StudyStatistics";
import ImportantDeadlines from "./ImportantDeadlines";

const { Title, Text, Paragraph } = Typography;

const StudentTimeline = () => {
  const { id } = useParams(); // ใช้ useParams เพื่อดึง ID จาก URL
  const studentId = id || localStorage.getItem("studentId"); // ถ้าไม่มี id ใน URL ให้ใช้จาก localStorage

  const [student, setStudent] = useState(DEFAULT_STUDENT_DATA);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS_DATA);
  const [notifications, setNotifications] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // เรียกข้อมูลไทม์ไลน์จาก API
    const fetchTimelineData = async () => {
      try {
        setLoading(true);

        // ตรวจสอบว่า studentId มีค่าหรือไม่ ถ้าไม่มีให้กำหนดค่าเริ่มต้น
        if (!studentId) {
          setError("ไม่พบรหัสนักศึกษา กรุณาเข้าสู่ระบบใหม่");
          setLoading(false);
          return;
        }

        // ดึงข้อมูลนักศึกษาจาก studentService เพื่อให้ได้ข้อมูลที่ถูกต้อง
        let studentData = {};
        let studentResponse;

        try {
          console.log("Fetching student data from studentService...");
          studentResponse = await studentService.getStudentInfo(studentId);

          if (studentResponse && studentResponse.success) {
            console.log(
              "Student data from studentService:",
              studentResponse.data
            );
            studentData = studentResponse.data || {};
          } else {
            console.warn(
              "Failed to fetch student data from studentService:",
              studentResponse?.message
            );
          }
        } catch (studentError) {
          console.error("Error fetching student data:", studentError);
        }

        // ดึงข้อมูลไทม์ไลน์
        const response = await timelineService.getStudentTimeline(studentId);

        // เพิ่ม console.log เพื่อตรวจสอบข้อมูลที่ได้จาก API
        console.log("===== TIMELINE DATA =====");
        console.log("API Response:", response);

        if (response.success) {
          // ข้อมูลจาก API สำเร็จ
          const timelineStudentData = response.data.student || {};

          // แสดงข้อมูลนักศึกษาที่ได้รับจาก API
          console.log("Student Data from timeline API:", timelineStudentData);

          // รวมข้อมูลนักศึกษาจากทั้งสอง API โดยให้ความสำคัญกับข้อมูลจาก studentService ก่อน
          const mergedStudentData = {
            ...timelineStudentData,
            ...(studentData || {}),
            // รักษาข้อมูลบางส่วนจาก timelineStudentData เฉพาะส่วนที่อาจไม่มีใน studentData
            isEnrolledInternship:
              studentData.isEnrolledInternship ||
              timelineStudentData.isEnrolledInternship ||
              false,
            isEnrolledProject:
              timelineStudentData.isEnrolledProject !== undefined
                ? timelineStudentData.isEnrolledProject
                : false,
            internshipStatus:
              studentData.internshipStatus ||
              timelineStudentData.internshipStatus ||
              "not_started",
            projectStatus:
              timelineStudentData.projectStatus ||
              studentData.projectStatus ||
              "not_started",
            nextAction: timelineStudentData.nextAction || "none",
          };

          console.log("Merged Student Data:", mergedStudentData);

          // ใช้ข้อมูล eligibility โดยตรงจาก studentData ถ้ามี
          let internshipEligible = {
            eligible: false,
            message: "ไม่มีข้อมูลสิทธิ์",
          };
          let projectEligible = {
            eligible: false,
            message: "ไม่มีข้อมูลสิทธิ์",
          };

          // ตรวจสอบข้อมูลสิทธิ์จาก studentData ก่อน (ข้อมูลที่น่าจะถูกต้องกว่า)
          if (studentData && studentData.eligibility) {
            console.log(
              "Using eligibility from studentService:",
              studentData.eligibility
            );

            if (studentData.eligibility.internship) {
              internshipEligible = studentData.eligibility.internship;
            }

            if (studentData.eligibility.project) {
              projectEligible = studentData.eligibility.project;
            }
          }
          // ถ้าไม่มี eligibility จาก studentData ตรวจสอบจาก timelineStudentData
          else if (mergedStudentData.eligibility) {
            console.log(
              "Using eligibility from timeline API:",
              mergedStudentData.eligibility
            );

            if (mergedStudentData.eligibility.internship) {
              internshipEligible = mergedStudentData.eligibility.internship;
            }

            if (mergedStudentData.eligibility.project) {
              projectEligible = mergedStudentData.eligibility.project;
            }
          }
          // ถ้าไม่มี eligibility ทั้งสอง API ให้คำนวณจากหน่วยกิตตามปกติ
          else {
            console.log("No eligibility data found, calculating from credits");

            const internshipRequirements = mergedStudentData.requirements
              ?.internship || { minCredits: 81 };
            const projectRequirements = mergedStudentData.requirements
              ?.project || { minCredits: 95, minMajorCredits: 47 };

            // ดึงปีการศึกษาจาก studentYear ที่ถูกต้อง
            const studentYear =
              mergedStudentData.studentYear &&
              typeof mergedStudentData.studentYear === "object"
                ? mergedStudentData.studentYear.year
                : typeof mergedStudentData.studentYear === "number"
                ? mergedStudentData.studentYear
                : typeof mergedStudentData.year === "number"
                ? mergedStudentData.year
                : 1;

            internshipEligible = isEligibleForInternship(
              studentYear,
              mergedStudentData.totalCredits || 0,
              mergedStudentData.majorCredits || 0,
              internshipRequirements
            );

            projectEligible = isEligibleForProject(
              studentYear,
              mergedStudentData.totalCredits || 0,
              mergedStudentData.majorCredits || 0,
              projectRequirements
            );
          }

          // แสดงผลลัพธ์การตรวจสอบสิทธิ์
          console.log("Internship Eligibility:", internshipEligible);
          console.log("Project Eligibility:", projectEligible);

          // ตรวจสอบและกำหนดค่าชั้นปีที่ถูกต้อง
          let studentYear = null;

          // ใช้ค่าจาก studentData.studentYear โดยตรง
          if (studentData && studentData.studentYear) {
            studentYear =
              studentData.studentYear.year || studentData.studentYear;
          }
          // ถ้าไม่มี ให้ใช้ค่าจาก mergedStudentData.studentYear
          else if (mergedStudentData && mergedStudentData.studentYear) {
            studentYear =
              mergedStudentData.studentYear.year ||
              mergedStudentData.studentYear;
          }
          // ถ้าไม่มีข้อมูล ให้ใช้ค่าเริ่มต้น
          else {
            studentYear = 1; // ค่าเริ่มต้น
          }

          console.log("Final student year:", studentYear);

          // อัพเดทข้อมูลนักศึกษาพร้อมสถานะสิทธิ์
          const enhancedStudentData = {
            ...mergedStudentData,
            internshipEligible: internshipEligible.eligible,
            projectEligible: projectEligible.eligible,
            internshipEligibleMessage: internshipEligible.message,
            projectEligibleMessage: projectEligible.message,
            year: studentYear,
          };

          setStudent(enhancedStudentData);
          console.log("Enhanced Student Data:", enhancedStudentData);

          // ตรวจสอบและแปลงรูปแบบข้อมูล
          let progressData;

          // ตรวจสอบว่ามีข้อมูล progress ใน response หรือไม่
          if (response.data.progress) {
            // ใช้ข้อมูล progress ที่มีอยู่แล้ว
            progressData = {
              internship: {
                ...(response.data.progress.internship ||
                  DEFAULT_PROGRESS_DATA.internship),
                blocked: !internshipEligible.eligible,
                blockReason: internshipEligible.eligible
                  ? ""
                  : internshipEligible.message,
              },
              project: {
                ...(response.data.progress.project ||
                  DEFAULT_PROGRESS_DATA.project),
                blocked: !projectEligible.eligible,
                blockReason: projectEligible.eligible
                  ? ""
                  : projectEligible.message,
              },
            };
          }
          // ถ้าไม่มี progress แต่มีข้อมูล timeline ให้แปลงเป็น progress
          else if (response.data.timeline) {
            const internshipSteps = response.data.timeline.internship || [];
            const projectSteps = response.data.timeline.project || [];

            progressData = {
              internship: {
                steps: internshipSteps,
                currentStep: 0,
                totalSteps: internshipSteps.length || 0,
                progress: 0,
                blocked: !internshipEligible.eligible,
                blockReason: internshipEligible.eligible
                  ? ""
                  : internshipEligible.message,
              },
              project: {
                steps: projectSteps,
                currentStep: 0,
                totalSteps: projectSteps.length || 0,
                progress: 0,
                blocked: !projectEligible.eligible,
                blockReason: projectEligible.eligible
                  ? ""
                  : projectEligible.message,
              },
            };

            // คำนวณความคืบหน้าสำหรับแต่ละประเภท
            ["internship", "project"].forEach((type) => {
              if (progressData[type].steps.length > 0) {
                // นับจำนวนขั้นตอนที่เสร็จสิ้น
                const completedSteps = progressData[type].steps.filter(
                  (step) => step.status === "completed"
                ).length;
                // นับขั้นตอนที่กำลังดำเนินการ
                const inProgressSteps = progressData[type].steps.filter(
                  (step) => step.status === "in_progress"
                ).length;
                // คำนวณเปอร์เซ็นต์ความคืบหน้าแบบใหม่: ขั้นตอนที่เสร็จสิ้น + (ขั้นตอนที่กำลังดำเนินการ/2)
                const totalSteps = progressData[type].steps.length;
                progressData[type].totalSteps = totalSteps;

                if (totalSteps > 0) {
                  progressData[type].progress = Math.round(
                    ((completedSteps + inProgressSteps * 0.5) / totalSteps) *
                      100
                  );
                }

                // หาขั้นตอนปัจจุบันที่กำลังดำเนินการ
                const currentStepIndex = progressData[type].steps.findIndex(
                  (step) => step.status === "in_progress"
                );
                // ถ้าไม่มีขั้นตอนที่กำลังดำเนินการ ให้ใช้จำนวนขั้นตอนที่เสร็จสิ้น
                progressData[type].currentStep =
                  currentStepIndex !== -1 ? currentStepIndex : completedSteps;
              }
            });
          }
          // ถ้าไม่มีทั้ง progress และ timeline ให้ใช้ค่าเริ่มต้น
          else {
            progressData = {
              internship: {
                ...DEFAULT_PROGRESS_DATA.internship,
                blocked: !internshipEligible.eligible,
                blockReason: internshipEligible.eligible
                  ? ""
                  : internshipEligible.message,
              },
              project: {
                ...DEFAULT_PROGRESS_DATA.project,
                blocked: !projectEligible.eligible,
                blockReason: projectEligible.eligible
                  ? ""
                  : projectEligible.message,
              },
            };
          }

          // ตรวจสอบว่าสถานะของนักศึกษา (ผ่านการฝึกงาน/โครงงานหรือไม่) และปรับค่าความคืบหน้า
          if (enhancedStudentData.internshipStatus === "completed") {
            progressData.internship.progress = 100;
            progressData.internship.currentStep =
              progressData.internship.totalSteps;
          }

          if (enhancedStudentData.projectStatus === "completed") {
            progressData.project.progress = 100;
            progressData.project.currentStep = progressData.project.totalSteps;
          }

          // ให้แน่ใจว่าความคืบหน้าไม่เกิน 100% และไม่ต่ำกว่า 0%
          ["internship", "project"].forEach((type) => {
            progressData[type].progress = Math.min(
              Math.max(progressData[type].progress, 0),
              100
            );
          });

          setProgress(progressData);
          setNotifications(response.data.notifications || []);
          setDeadlines(
            response.data.upcomingDeadlines || response.data.deadlines || []
          );
          setError(null);
        } else {
          // มีข้อผิดพลาดจาก API
          console.log("API response error:", response.message);
          setError(response.message || "ไม่สามารถดึงข้อมูลไทม์ไลน์ได้");

          // ลองสร้างไทม์ไลน์เริ่มต้นในกรณีที่ไม่พบข้อมูลไทม์ไลน์
          if (
            response.message &&
            (response.message.includes("ไม่พบข้อมูลไทม์ไลน์") ||
              response.message.includes("ไม่พบขั้นตอนใน Timeline"))
          ) {
            try {
              message.info("กำลังสร้างไทม์ไลน์เริ่มต้นให้กับนักศึกษา...");
              const initResponse =
                await timelineService.initializeStudentTimeline(studentId);
              if (initResponse.success) {
                message.success(
                  "สร้างไทม์ไลน์เริ่มต้นสำเร็จ กำลังโหลดข้อมูล..."
                );
                // โหลดข้อมูลใหม่หลังจากสร้างไทม์ไลน์
                const newResponse = await timelineService.getStudentTimeline(
                  studentId
                );
                if (newResponse.success) {
                  // ทำตามขั้นตอนเดิมอีกครั้ง เมื่อมีข้อมูลใหม่
                  const studentData = newResponse.data.student || {};

                  // ใช้ข้อมูล eligibility จาก response โดยตรง
                  let internshipEligible = {
                    eligible: false,
                    message: "ไม่มีข้อมูลสิทธิ์",
                  };
                  let projectEligible = {
                    eligible: false,
                    message: "ไม่มีข้อมูลสิทธิ์",
                  };

                  // ถ้ามีข้อมูล eligibility จาก API ให้ใช้ค่าจาก API
                  if (studentData.eligibility) {
                    if (studentData.eligibility.internship) {
                      internshipEligible = studentData.eligibility.internship;
                    }
                    if (studentData.eligibility.project) {
                      projectEligible = studentData.eligibility.project;
                    }
                  }
                  // ถ้าไม่มี ให้คำนวณจากหน่วยกิตตามปกติ
                  else {
                    const internshipRequirements =
                      studentData.requirements?.internship || null;
                    const projectRequirements =
                      studentData.requirements?.project || null;

                    internshipEligible = isEligibleForInternship(
                      studentData.studentYear?.year ||
                        studentData.studentYear ||
                        0,
                      studentData.totalCredits || 0,
                      studentData.majorCredits || 0,
                      internshipRequirements
                    );

                    projectEligible = isEligibleForProject(
                      studentData.studentYear?.year ||
                        studentData.studentYear ||
                        0,
                      studentData.totalCredits || 0,
                      studentData.majorCredits || 0,
                      projectRequirements
                    );
                  }

                  setStudent({
                    ...studentData,
                    internshipEligible: internshipEligible.eligible,
                    projectEligible: projectEligible.eligible,
                    internshipEligibleMessage: internshipEligible.message,
                    projectEligibleMessage: projectEligible.message,
                    internshipStatus:
                      studentData.internshipStatus || "not_started",
                    projectStatus: studentData.projectStatus || "not_started",
                    // ใช้ข้อมูล studentYear แบบตรง หรือจาก object
                    year:
                      studentData.studentYear?.year ||
                      studentData.studentYear ||
                      1,
                    status: studentData.status || "normal",
                  });

                  // ใช้ข้อมูล progress ที่สร้างใหม่จากการ init
                  if (newResponse.data.progress) {
                    const updatedProgress = {
                      ...newResponse.data.progress,
                      internship: {
                        ...newResponse.data.progress.internship,
                        blocked: !internshipEligible.eligible,
                        blockReason: internshipEligible.eligible
                          ? ""
                          : internshipEligible.message,
                      },
                      project: {
                        ...newResponse.data.progress.project,
                        blocked: !projectEligible.eligible,
                        blockReason: projectEligible.eligible
                          ? ""
                          : projectEligible.message,
                      },
                    };
                    setProgress(updatedProgress);
                  } else if (newResponse.data.timeline) {
                    // ถ้าไม่มี progress แต่มี timeline ให้แปลงเป็น progress
                    const internshipSteps =
                      newResponse.data.timeline.internship || [];
                    const projectSteps =
                      newResponse.data.timeline.project || [];

                    const processedProgress = {
                      internship: {
                        steps: internshipSteps,
                        currentStep: 0,
                        totalSteps: internshipSteps.length,
                        progress: 0,
                        blocked: !internshipEligible.eligible,
                        blockReason: internshipEligible.eligible
                          ? ""
                          : internshipEligible.message,
                      },
                      project: {
                        steps: projectSteps,
                        currentStep: 0,
                        totalSteps: projectSteps.length,
                        progress: 0,
                        blocked: !projectEligible.eligible,
                        blockReason: projectEligible.eligible
                          ? ""
                          : projectEligible.message,
                      },
                    };
                    setProgress(processedProgress);
                  }

                  setNotifications(newResponse.data.notifications || []);
                  setDeadlines(newResponse.data.deadlines || []);
                  setError(null);
                }
              } else {
                message.error("ไม่สามารถสร้างไทม์ไลน์เริ่มต้นได้");
              }
            } catch (initError) {
              console.error("Error initializing timeline:", initError);
              message.error("เกิดข้อผิดพลาดในการสร้างไทม์ไลน์เริ่มต้น");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching timeline data:", err);
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง");
        message.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [studentId]);

  // ถ้ากำลังโหลดข้อมูล ให้แสดง Loading
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  // ถ้ามีข้อผิดพลาด ให้แสดงข้อความแจ้งเตือน
  if (error) {
    return (
      <Alert
        message="ไม่สามารถโหลดข้อมูลไทม์ไลน์ได้"
        description={error}
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={() => window.location.reload()}>
            ลองใหม่
          </Button>
        }
      />
    );
  }

  return (
    <div className="student-timeline">
      {/* ส่วนหัวและแสดงภาพรวม */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className="dashboard-card">
            <Row gutter={16} align="middle">
              <Col span={16}>
                <Title level={4}>แนวทางการศึกษาของคุณ</Title>
                <Paragraph>
                  ติดตามขั้นตอนและความคืบหน้าตลอดการศึกษาในระบบฝึกงานและโครงงานพิเศษ
                </Paragraph>
              </Col>
              <Col span={8} style={{ textAlign: "right" }}>
                <Space direction="vertical" align="end">
                  <Text strong>
                    {(() => {
                      // ใช้ข้อมูลชั้นปีจากหลายแหล่ง
                      let studentYear = null;

                      // 1. พยายามใช้จาก studentYear.year ก่อน (กรณีที่ API ส่งมาเป็น object)
                      if (
                        student &&
                        student.studentYear &&
                        typeof student.studentYear === "object" &&
                        student.studentYear.year
                      ) {
                        studentYear = student.studentYear.year;
                      }
                      // 2. ถ้าไม่มี ลองดูจาก student.studentYear (กรณี API ส่งมาเป็นตัวเลข)
                      else if (
                        student &&
                        typeof student.studentYear === "number" &&
                        student.studentYear > 0
                      ) {
                        studentYear = student.studentYear;
                      }
                      // 3. ถ้าไม่มี ลองดูจาก student.year
                      else if (
                        student &&
                        typeof student.year === "number" &&
                        student.year > 0
                      ) {
                        studentYear = student.year;
                      }
                      // 4. ถ้ายังไม่มี และมีรหัสนักศึกษา ลองคำนวณจาก studentCode
                      else if (student && student.studentCode) {
                        try {
                          const currentDate = new Date();
                          const currentYear = currentDate.getFullYear() + 543; // พ.ศ.
                          const studentCodePrefix =
                            student.studentCode.substring(0, 2);
                          const enrollmentYear =
                            parseInt(studentCodePrefix) + 2500; // พ.ศ. ที่เข้าเรียน
                          studentYear = currentYear - enrollmentYear + 1;

                          // ตรวจสอบว่าชั้นปีอยู่ในช่วงที่เป็นไปได้
                          if (studentYear < 1) studentYear = 1;
                          if (studentYear > 8) studentYear = 8;
                        } catch (e) {
                          console.error("Error calculating student year:", e);
                          studentYear = null;
                        }
                      }

                      if (!studentYear) {
                        return "ชั้นปีที่ไม่ระบุ";
                      }

                      // กำหนดภาคการศึกษาปัจจุบัน (ตรวจสอบตามเดือนปัจจุบัน)
                      const currentDate = new Date();
                      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

                      // รูปแบบไทยของภาคการศึกษา - แก้ไขตามปฏิทินการศึกษาไทย
                      let semester = "";
                      // ภาคเรียนที่ 2: มกราคม (1) - พฤษภาคม (5)
                      // ภาคฤดูร้อน: มิถุนายน (6) - กรกฎาคม (7)
                      // ภาคเรียนที่ 1: สิงหาคม (8) - ธันวาคม (12)
                      if (currentMonth >= 1 && currentMonth <= 5) {
                        semester = "ภาคเรียนที่ 2";
                      } else if (currentMonth >= 6 && currentMonth <= 7) {
                        semester = "ภาคฤดูร้อน";
                      } else {
                        semester = "ภาคเรียนที่ 1";
                      }

                      // คำนวณปีการศึกษาไทย (พ.ศ.)
                      const thaiYear = currentDate.getFullYear() + 543;
                      // ถ้าอยู่ภาคเรียนที่ 1 (เดือน 8-12) ให้ใช้ปีปัจจุบัน
                      // ถ้าอยู่ภาคเรียนที่ 2 หรือ ฤดูร้อน (เดือน 1-7) ให้ลบ 1 จากปีปัจจุบัน
                      const academicYear =
                        currentMonth >= 8 ? thaiYear : thaiYear - 1;

                      return `ชั้นปีที่ ${studentYear} (${semester} ปีการศึกษา ${academicYear})`;
                    })()}
                  </Text>
                  <Badge
                    status={
                      student.status === "normal"
                        ? "success"
                        : student.status === "EXTENDED" ||
                          student.status === "extended"
                        ? "warning"
                        : student.status === "probation"
                        ? "warning"
                        : student.status === "retired"
                        ? "error"
                        : "warning"
                    }
                    text={
                      student.status === "normal"
                        ? "นักศึกษาปกติ"
                        : student.status === "EXTENDED" ||
                          student.status === "extended"
                        ? "นักศึกษาตกค้าง"
                        : student.status === "probation"
                        ? "นักศึกษาวิทยทัณฑ์"
                        : student.status === "retired"
                        ? "พ้นสภาพนักศึกษา"
                        : "นักศึกษาตกค้าง"
                    }
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ส่วนการดำเนินการถัดไป */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col span={24}>
          <NextAction student={student} />
        </Col>
      </Row>

      {/* ส่วนแสดงการแจ้งเตือน */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col span={24}>
          <Card>
            <Notifications notifications={notifications} />
          </Card>
        </Col>
      </Row>

      {/* ส่วนแสดงความก้าวหน้าหลัก */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <EducationPath student={student} />
        </Col>
      </Row>

      {/* ส่วนแสดงรายละเอียดขั้นตอน */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <InternshipSection student={student} progress={progress} />
        </Col>

        <Col xs={24} lg={12}>
          <ProjectSection student={student} progress={progress} />
        </Col>
      </Row>

      {/* ส่วนแสดงกำหนดการสำคัญ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            <ImportantDeadlines deadlines={deadlines} />
          </Card>
        </Col>
      </Row>

      {/* ส่วนสถิติการเรียน */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <StudyStatistics student={student} />
        </Col>
      </Row>
    </div>
  );
};

export default StudentTimeline;
