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
      const stats = await studentService.getStats();
      console.log("Statistics from API:", stats);
      setStatistics(stats);
    } catch (error) {
      message.error("ไม่สามารถโหลดข้อมูลสถิติได้");
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
  const handleSaveStudent = async (updatedStudent) => {
    try {
      const updatedData = await studentService.updateStudent(
        updatedStudent.studentCode,
        updatedStudent
      );
      message.success("อัปเดตข้อมูลสำเร็จ");

      // อัปเดต selectedStudent ด้วยข้อมูลใหม่
      setSelectedStudent((prev) => ({
        ...prev,
        ...updatedData,
      }));

      fetchStudents(); // รีเฟรชข้อมูล
      handleCloseDrawer();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
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
          handleCloseDrawer(); // เพิ่มบรรทัดนี้เพื่อปิด drawer
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
    console.log("Fetching statistics...");
    fetchStudents();
    fetchStatistics();
    fetchAcademicYearOptions();
  }, []);

  // โหลดข้อมูลใหม่เมื่อมีการเปลี่ยนแปลงตัวกรอง
  useEffect(() => {
    fetchStudents();
  }, [searchText, statusFilter, academicYear]);

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
            onRefresh={fetchStudents}
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
