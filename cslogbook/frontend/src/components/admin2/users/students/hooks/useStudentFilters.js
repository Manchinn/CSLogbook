import { useState, useMemo, useEffect } from 'react';
import { STUDENT_STATUS } from '../../../../../utils/adminConstants';

export const useStudentFilters = (students = []) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [academicYear, setAcademicYear] = useState(null);
  
  // สร้างตัวเลือกปีการศึกษา
  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear() + 543;
    return Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: `${currentYear - i}`
    }));
  }, []);
  
  // กรองข้อมูลนักศึกษา - ส่วนนี้ยังคงทำงานในฝั่ง client เมื่อได้ข้อมูลมาแล้ว
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // กรองตามข้อความค้นหา
      const matchesSearch = !searchText ||
        student.studentCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchText.toLowerCase());
      
      // กรองตามสถานะ
      let matchesStatus = !statusFilter;
      if (statusFilter) {
        if (statusFilter === STUDENT_STATUS.NO_ELIGIBILITY) {
          return (!student.isEligibleForInternship && !student.isEligibleForProject) &&
            (student.status !== STUDENT_STATUS.ELIGIBLE_INTERNSHIP &&
            student.status !== STUDENT_STATUS.ELIGIBLE_PROJECT &&
            student.status !== STUDENT_STATUS.IN_PROGRESS_INTERNSHIP &&
            student.status !== STUDENT_STATUS.IN_PROGRESS_PROJECT &&
            student.status !== STUDENT_STATUS.COMPLETED_INTERNSHIP &&
            student.status !== STUDENT_STATUS.COMPLETED_PROJECT);
        } else if (student.status) {
          matchesStatus = student.status === statusFilter;
        } else {
          if (statusFilter === STUDENT_STATUS.ELIGIBLE_PROJECT) {
            matchesStatus = student.isEligibleForProject;
          } else if (statusFilter === STUDENT_STATUS.ELIGIBLE_INTERNSHIP) {
            matchesStatus = student.isEligibleForInternship;
          }
        }
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [students, searchText, statusFilter]);
  
  // คำนวณสถิติ
  const statistics = useMemo(() => {
    const eligibleInternship = filteredStudents.filter(s => 
      s.isEligibleForInternship
    ).length;
    
    const eligibleProject = filteredStudents.filter(s => 
      s.isEligibleForProject
    ).length;
    
    const noEligibility = filteredStudents.filter(s => 
      !s.isEligibleForInternship && !s.isEligibleForProject
    ).length;
    
    const inProgress = filteredStudents.filter(s =>
      s.status === STUDENT_STATUS.IN_PROGRESS_INTERNSHIP ||
      s.status === STUDENT_STATUS.IN_PROGRESS_PROJECT
    ).length;
    
    return {
      total: filteredStudents.length,
      eligibleInternship,
      eligibleProject,
      noEligibility,
      inProgress
    };
  }, [filteredStudents]);
  
  // รีเซ็ตฟิลเตอร์
  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('');
    setAcademicYear(null);
  };
  
  // สร้าง filter params สำหรับใช้กับ React Query
  const filterParams = useMemo(() => {
    const params = {};
    if (searchText) params.search = searchText;
    if (statusFilter) params.status = statusFilter;
    if (academicYear) params.academicYear = academicYear;
    return params;
  }, [searchText, statusFilter, academicYear]);
  
  return {
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    academicYear,
    setAcademicYear,
    academicYearOptions,
    filteredStudents,
    statistics,
    resetFilters,
    filterParams
  };
};