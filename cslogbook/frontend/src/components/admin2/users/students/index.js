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

  // ดึงข้อมูลนักศึกษา
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentService.getAllStudents({
        search: searchText,
        status: statusFilter,
        academicYear,
      });
      setStudents(response);
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลสถิติ
  const fetchStatistics = async () => {
    try {
      // แทนที่จะดึงจาก API โดยตรง ให้คำนวณจากข้อมูลนักศึกษาที่มีอยู่แล้ว
      const studentData = await studentService.getAllStudents({
        search: searchText,
        status: statusFilter,
        academicYear,
      });

      // คำนวณสถิติจากข้อมูลนักศึกษา
      const total = studentData.length;
      const eligibleInternship = studentData.filter(
        (s) => s.isEligibleForInternship
      ).length;
      const eligibleProject = studentData.filter(
        (s) => s.isEligibleForProject
      ).length;

      console.log("Calculated statistics:", {
        total,
        eligibleInternship,
        eligibleProject,
      });

      // จัดรูปแบบข้อมูลให้ตรงกับที่ StudentStatistics คาดหวัง
      const formattedStats = {
        total: total,
        internshipEligible: eligibleInternship,
        projectEligible: eligibleProject,
      };

      setStatistics(formattedStats);
    } catch (error) {
      console.error("Error calculating statistics:", error);
      message.error("ไม่สามารถคำนวณข้อมูลสถิติได้");
    }
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
      fetchStatistics();
      handleCloseDrawer();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error.message || "ไม่ทราบสาเหตุ"));
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
          fetchStatistics(); // เพิ่มการอัปเดตสถิติหลังลบข้อมูล
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
    console.log("Fetching data...");
    // ดึงข้อมูลนักศึกษาแล้วคำนวณสถิติ
    fetchStudents();
    fetchStatistics();
    fetchAcademicYearOptions();
  }, []);

  // ปรับปรุงข้อมูลเมื่อมีการเปลี่ยนแปลงตัวกรอง
  useEffect(() => {
    fetchStudents();
    // ถ้าต้องการให้สถิติเปลี่ยนตามตัวกรอง ให้เรียก fetchStatistics ด้วย
    fetchStatistics();
  }, [searchText, statusFilter, academicYear]);

  // เพิ่ม debugging สำหรับสถิติ
  useEffect(() => {
    console.log("Statistics state updated:", statistics);
  }, [statistics]);

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
              fetchStudents();
              fetchStatistics(); // เพิ่มการอัปเดตสถิติเมื่อกดรีเฟรช
            }}
            onAddStudent={() => {
              setSelectedStudent(null);
              setDrawerVisible(true);
              setEditMode(true);
            }}
            onResetFilters={() => {
              setSearchText("");
              setStatusFilter("");
              setAcademicYear(null);
            }}
            loading={loading}
          />
        </Col>
      </Row>

      <StudentTable
        students={students}
        loading={loading}
        onView={handleViewStudent}
        onEdit={(student) => {
          handleViewStudent(student);
          setTimeout(() => {
            handleEditStudent();
          }, 100);
        }}
        onDelete={handleDeleteStudent}
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
