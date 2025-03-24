import { useState, useMemo, useEffect } from 'react';

export const useStudentFilters = (students) => {
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
  
  // กรองข้อมูลนักศึกษา
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // กรองตามข้อความค้นหา
      const matchesSearch = !searchText ||
        student.studentCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchText.toLowerCase());
      
      // กรองตามสถานะ (ตามโค้ดเดิม)
      let matchesStatus = !statusFilter;
      // ... โค้ดกรองสถานะเดิม ...
      
      return matchesSearch && matchesStatus;
    });
  }, [students, searchText, statusFilter]);
  
  // คำนวณสถิติ
  const statistics = useMemo(() => {
    // ... โค้ดคำนวณสถิติเดิม ...
    return {
      total: filteredStudents.length,
      // ... ข้อมูลสถิติอื่นๆ ...
    };
  }, [filteredStudents]);
  
  // รีเซ็ตฟิลเตอร์
  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('');
    setAcademicYear(null);
  };
  
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
    resetFilters
  };
};