import { useStudentData } from './useStudentData';
import { useStudentFilters } from './useStudentFilters';
import { useStudentForm } from './useStudentForm';
import { useModalHandlers } from './useModalHandlers';
import { useEffect } from 'react';

export const useStudents = () => {
  // สร้าง filters ก่อน เพื่อใช้ filterParams สำหรับเรียกข้อมูล
  const {
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    academicYear,
    setAcademicYear,
    academicYearOptions,
    resetFilters,
    filterParams
  } = useStudentFilters([]);

  // เรียกใช้ useStudentData ด้วย filterParams
  const {
    students,
    loading,
    selectedStudent,
    setSelectedStudent,
    fetchStudentsWithParams,
    refetch,
    addStudent,
    updateStudent,
    deleteStudent,
    isAdding,
    isUpdating,
    isDeleting
  } = useStudentData(filterParams);

  // เรียกใช้ useStudentForm ด้วย add/update functions
  const {
    form,
    drawerVisible,
    setDrawerVisible,
    editMode,
    setEditMode,
    handleAddStudent,
    handleViewStudent,
    handleEditStudent,
    handleCancelEdit,
    handleCloseDrawer,
    handleSaveStudent
  } = useStudentForm(addStudent, updateStudent);

  // เรียกใช้ useModalHandlers พร้อม delete function
  const {
    uploadModalVisible,
    setUploadModalVisible,
    handleUploadSuccess,
    handleDeleteStudent: handleDelete
  } = useModalHandlers(deleteStudent);

  // แทน filteredStudents ด้วยข้อมูลที่กรองโดยใช้ students จาก API
  const { filteredStudents, statistics } = useStudentFilters(students);
  
  // ฟังก์ชัน wrapper สำหรับ handleDeleteStudent
  const handleDeleteStudent = (studentCode) => {
    handleDelete(studentCode, selectedStudent, setDrawerVisible);
  };
  
  // อัพเดทการโหลดข้อมูลเมื่อ filters เปลี่ยน
  useEffect(() => {
    fetchStudentsWithParams(filterParams);
  }, [filterParams, fetchStudentsWithParams]);

  // ตรวจสอบให้แน่ใจว่า selectedStudent มีข้อมูลถูกต้องหลังการ refresh
  useEffect(() => {
    // ถ้ามี selectedStudent และ students มีข้อมูล
    if (selectedStudent && students && students.length > 0) {
      // ค้นหา student ใน students ที่มี studentCode ตรงกับ selectedStudent
      const updatedStudent = students.find(s => s.studentCode === selectedStudent.studentCode);
      
      // ถ้าพบ student ทำการอัพเดท selectedStudent เพื่อให้มีข้อมูลล่าสุด
      if (updatedStudent) {
        setSelectedStudent(updatedStudent);
      }
    }
  }, [students, selectedStudent, setSelectedStudent]);

  // เพิ่มการ log ข้อมูล
  useEffect(() => {
    if (selectedStudent) {
      console.log("Currently selected student:", selectedStudent);
    }
  }, [selectedStudent]);

  return {
    // ข้อมูล
    students: filteredStudents,
    statistics,
    loading,
    
    // สถานะ
    isAdding,
    isUpdating,
    isDeleting,
    
    // การจัดการฟอร์มและ drawer
    form,
    drawerVisible,
    editMode,
    selectedStudent,
    
    // filters
    searchText,
    statusFilter,
    academicYear,
    academicYearOptions,
    
    // actions - filters
    setSearchText,
    setStatusFilter,
    setAcademicYear,
    resetFilters,
    
    // actions - CRUD
    handleAddStudent,
    handleViewStudent,
    handleEditStudent,
    handleCancelEdit,
    handleSaveStudent,
    handleDeleteStudent,
    handleCloseDrawer,
    refetch,
    
    // actions - upload
    uploadModalVisible,
    setUploadModalVisible,
    handleUploadSuccess
  };
};