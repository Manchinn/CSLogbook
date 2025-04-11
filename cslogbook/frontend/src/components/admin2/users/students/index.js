import React, { useState, useEffect } from "react";
import { Row, Col, message, Form, Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

import "./styles.css";

// นำเข้าคอมโพเนนต์
import StudentStatistics from "./components/StudentStatistics";
import StudentFilters from "./components/StudentFilters";
import StudentTable from "./components/StudentTable";
import StudentDrawer from "./components/StudentDrawer";
import { studentService } from "../../../../services/studentService";

const StudentList = () => {
  // State สำหรับจัดการข้อมูล
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form] = Form.useForm();

  // State สำหรับตัวกรอง
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [academicYear, setAcademicYear] = useState(null);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);

  // ดึงข้อมูลนักศึกษาทั้งหมดโดยไม่ส่งพารามิเตอร์สำหรับการกรอง
  const fetchStudents = React.useCallback(async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลทั้งหมดโดยไม่มีการกรอง
      const response = await studentService.getAllStudents({});
      setStudents(response);
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงข้อมูลสถิติ
  const calculateStatistics = () => {
    const filtered = filteredStudents();

    let eligibleInternship = 0;
    let eligibleProject = 0;

    filtered.forEach((student) => {
      if (student.isEligibleForInternship) eligibleInternship++;
      if (student.isEligibleForProject) eligibleProject++;
    });

    setStatistics({
      total: filtered.length,
      internshipEligible: eligibleInternship,
      projectEligible: eligibleProject,
    });
  };

  const filteredStudents = () => {
    if (!Array.isArray(students)) return [];

    return students.filter((student) => {
      // 1. กรองตาม statusFilter
      if (statusFilter === "internship" && !student.isEligibleForInternship) {
        return false;
      }
      if (statusFilter === "project" && !student.isEligibleForProject) {
        return false;
      }

      // 2. กรองตาม academicYear
      if (academicYear && student.academicYear !== academicYear) {
        return false;
      }

      // 3. กรองตาม searchText
      if (searchText && searchText.trim() !== "") {
        const searchLower = searchText.toLowerCase();
        return (
          (student.studentCode &&
            student.studentCode.toLowerCase().includes(searchLower)) ||
          (student.firstName &&
            student.firstName.toLowerCase().includes(searchLower)) ||
          (student.lastName &&
            student.lastName.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  };

  // ดึงข้อมูลปีการศึกษา
  const fetchAcademicYearOptions = () => {
    const currentYear = new Date().getFullYear() + 543;
    const options = Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: `${currentYear - i}`,
    }));
    setAcademicYearOptions(options);
  };

  // เปิด Drawer เพื่อดูข้อมูลนักศึกษา
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setDrawerVisible(true);
    setEditMode(false);
  };

  // เปิด Drawer เพื่อแก้ไขข้อมูลนักศึกษา
  const handleEditStudent = () => {
    setEditMode(true);
  };

  // ปิด Drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditMode(false);
    setSelectedStudent(null);
  };

  // บันทึกข้อมูลนักศึกษา
  const handleSaveStudent = async (studentData) => {
    try {
      let result;

      if (selectedStudent) {
        // กรณีแก้ไขนักศึกษาที่มีอยู่แล้ว (ใช้ selectedStudent แทน studentData.id)
        result = await studentService.updateStudent(
          studentData.studentCode || selectedStudent.studentCode,
          studentData
        );
        message.success("อัปเดตข้อมูลสำเร็จ");
      } else {
        // กรณีเพิ่มนักศึกษาใหม่
        result = await studentService.addStudent(studentData);
        message.success("เพิ่มนักศึกษาสำเร็จ");
      }

      fetchStudents();
      calculateStatistics();
      handleCloseDrawer();
    } catch (error) {
      message.error(
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error.message || "ไม่ทราบสาเหตุ")
      );
    }
  };

  // ลบนักศึกษา
  const handleDeleteStudent = async (studentCode) => {
    Modal.confirm({
      title: "ยืนยันการลบข้อมูล",
      icon: <ExclamationCircleOutlined />,
      content: "คุณต้องการลบข้อมูลนักศึกษารหัส " + studentCode + " ใช่หรือไม่?",
      okText: "ใช่ ลบข้อมูล",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await studentService.deleteStudent(studentCode);
          message.success("ลบข้อมูลสำเร็จ");
          fetchStudents(); // รีเฟรชข้อมูล
          handleCloseDrawer(); // ปิด drawer
        } catch (error) {
          message.error(
            "เกิดข้อผิดพลาดในการลบข้อมูล: " + (error.message || "ไม่ทราบสาเหตุ")
          );
        }
      },
    });
  };

  // โหลดข้อมูลเมื่อ component ถูก mount
  useEffect(() => {
    fetchStudents();
    fetchAcademicYearOptions();
  }, []);

  useEffect(() => {
    calculateStatistics();
  }, [students, searchText, statusFilter, academicYear]);

  return (
    <div className="admin-student-container">
      <Row justify="space-between" align="middle" className="filter-section">
        <Col>
          <StudentStatistics statistics={statistics} />
        </Col>
        <Col>
          <StudentFilters
            searchText={searchText}
            setSearchText={setSearchText}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            academicYearOptions={academicYearOptions}
            onRefresh={() => {
              // รีเซ็ตตัวกรองทั้งหมด
              setSearchText("");
              setStatusFilter("");
              setAcademicYear(null);

              // จากนั้นดึงข้อมูลใหม่
              fetchStudents();
            }}
            onAddStudent={() => {
              // รีเซ็ต form ให้ว่างก่อน
              form.resetFields();
              // จากนั้นกำหนดค่าเริ่มต้น
              form.setFieldsValue({
                totalCredits: 0,
                majorCredits: 0
              });
              // รีเซ็ตสถานะการเลือกนักศึกษา
              setSelectedStudent(null);
              // เปิด drawer
              setDrawerVisible(true);
              // เปิดโหมดแก้ไข
              setEditMode(true);
            }}
            loading={loading}
          />
        </Col>
      </Row>

      <StudentTable
        students={filteredStudents()}
        loading={loading}
        onView={handleViewStudent}
        onEdit={(student) => {
          handleViewStudent(student);
          setTimeout(() => {
            handleEditStudent();
          }, 100);
        }}
        onDelete={handleDeleteStudent}
        emptyText={
          statusFilter
            ? `ไม่พบนักศึกษาที่มีสถานะ "${
                statusFilter === "internship"
                  ? "มีสิทธิ์ฝึกงาน"
                  : "มีสิทธิ์โครงงาน"
              }"`
            : searchText
            ? `ไม่พบนักศึกษาที่ตรงกับคำค้นหา "${searchText}"`
            : "ไม่พบข้อมูลนักศึกษา"
        }
      />

      <StudentDrawer
        visible={drawerVisible}
        student={selectedStudent}
        editMode={editMode}
        form={form}
        onClose={handleCloseDrawer}
        onEdit={handleEditStudent}
        onCancelEdit={() => setEditMode(false)}
        onSave={handleSaveStudent}
        confirmLoading={loading}
      />
    </div>
  );
};

export default StudentList;
