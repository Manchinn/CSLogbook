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

  const filterParams = React.useMemo(() => {
    const params = {};
    if (statusFilter) {
      params.status = statusFilter;
    }

    if (academicYear) {
      params.academicYear = academicYear;
    }

    return params;
  }, [statusFilter, academicYear]);

  const calculateStatistics = React.useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        total: 0,
        internshipEligible: 0,
        projectEligible: 0,
        noEligibility: 0,
      };
    }

    let eligibleInternship = 0;
    let eligibleProject = 0;
    let noEligibility = 0;

    data.forEach((student) => {
      if (student.isEligibleForInternship) {
        eligibleInternship += 1;
      }

      if (student.isEligibleForProject) {
        eligibleProject += 1;
      }

      if (!student.isEligibleForInternship && !student.isEligibleForProject) {
        noEligibility += 1;
      }
    });

    return {
      total: data.length,
      internshipEligible: eligibleInternship,
      projectEligible: eligibleProject,
      noEligibility,
    };
  }, []);

  // ดึงข้อมูลนักศึกษาจาก API ตามตัวกรองที่ระบุ
  const fetchStudents = React.useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const response = await studentService.getAllStudents(params);
        setStudents(response);
      } catch (error) {
        message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ดึงข้อมูลปีการศึกษา
  const fetchAcademicYearOptions = () => {
    const currentYear = new Date().getFullYear() + 543;
    const options = Array.from({ length: 10 }, (_, i) => ({
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
      if (selectedStudent) {
        // กรณีแก้ไขนักศึกษาที่มีอยู่แล้ว (ใช้ selectedStudent แทน studentData.id)
        await studentService.updateStudent(
          studentData.studentCode || selectedStudent.studentCode,
          studentData
        );
        message.success("อัปเดตข้อมูลสำเร็จ");
      } else {
        // กรณีเพิ่มนักศึกษาใหม่
        await studentService.addStudent(studentData);
        message.success("เพิ่มนักศึกษาสำเร็จ");
      }

      fetchStudents(filterParams);
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
          fetchStudents(filterParams); // รีเฟรชข้อมูล
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
    fetchAcademicYearOptions();
  }, []);

  useEffect(() => {
    fetchStudents(filterParams);
  }, [fetchStudents, filterParams]);

  const filteredStudents = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return students.filter((student) => {
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "internship" && student.isEligibleForInternship) ||
        (statusFilter === "project" && student.isEligibleForProject);

      if (!matchesStatus) {
        return false;
      }

      if (academicYear && student.academicYear && student.academicYear !== academicYear) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchFields = [
        student.studentCode,
        student.firstName,
        student.lastName,
        `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        student.email,
        student.classroom,
      ];

      return searchFields
        .filter((field) => typeof field === "string" && field.trim())
        .some((field) => field.toLowerCase().includes(keyword));
    });
  }, [students, searchText, statusFilter, academicYear]);

  const displayedStatistics = React.useMemo(
    () => calculateStatistics(filteredStudents),
    [filteredStudents, calculateStatistics]
  );

  const emptyTableText = React.useMemo(() => {
    if (searchText && searchText.trim()) {
      return `ไม่พบนักศึกษาที่ตรงกับคำค้นหา "${searchText}"`;
    }

    if (statusFilter) {
      return `ไม่พบนักศึกษาที่มีสถานะ "${
        statusFilter === "internship" ? "มีสิทธิ์ฝึกงาน" : "มีสิทธิ์โครงงาน"
      }"`;
    }

    if (academicYear) {
      return `ไม่พบนักศึกษาของปีการศึกษา ${academicYear}`;
    }

    return "ไม่พบข้อมูลนักศึกษา";
  }, [searchText, statusFilter, academicYear]);

  return (
    <div className="admin-student-container">
      <Row justify="space-between" align="middle" className="filter-section">
        <Col>
          <StudentStatistics statistics={displayedStatistics} />
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
              fetchStudents({});
            }}
            onAddStudent={() => {
              // รีเซ็ต form ให้ว่างก่อน
              form.resetFields();
              // จากนั้นกำหนดค่าเริ่มต้น
              form.setFieldsValue({
                totalCredits: 0,
                majorCredits: 0,
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
        students={filteredStudents}
        loading={loading}
        onView={handleViewStudent}
        onEdit={(student) => {
          handleViewStudent(student);
          setTimeout(() => {
            handleEditStudent();
          }, 100);
        }}
        onDelete={handleDeleteStudent}
        emptyText={emptyTableText}
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
