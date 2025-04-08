import React from 'react';
import { Row, Col } from 'antd';
import './styles.css';

// นำเข้า custom hook
import { useStudents } from './hooks/useStudents';

// นำเข้าคอมโพเนนต์
import StudentStatistics from './components/StudentStatistics';
import StudentFilters from './components/StudentFilters';
import StudentTable from './components/StudentTable';
import StudentDrawer from './components/StudentDrawer';

const StudentList = () => {
    // ใช้งาน custom hook เพียงตัวเดียว
    const {
        students,
        statistics,
        loading,
        form,
        drawerVisible,
        editMode,
        selectedStudent,
        searchText,
        statusFilter,
        academicYear,
        academicYearOptions,
        setSearchText,
        setStatusFilter,
        setAcademicYear,
        resetFilters,
        handleAddStudent,
        handleViewStudent,
        handleEditStudent,
        handleCancelEdit,
        handleSaveStudent,
        handleDeleteStudent,
        handleCloseDrawer,
        refetch,
        isAdding,
        isUpdating
    } = useStudents();

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
                        onRefresh={refetch}
                        onAddStudent={handleAddStudent}
                        onResetFilters={resetFilters}
                        loading={loading}
                    />
                </Col>
            </Row>

            <StudentTable
                students={students}
                loading={loading}
                onView={handleViewStudent}
                onEdit={(student) => {
                    // กำหนดให้มีการเรียก handleViewStudent ก่อนเสมอ แล้วค่อย delay การแสดงโหมดแก้ไข
                    handleViewStudent(student);
                    setTimeout(() => {
                        handleEditStudent();
                    }, 100); // เพิ่ม delay เล็กน้อยให้ drawer ทำงานเสร็จก่อน
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
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveStudent}
                confirmLoading={isAdding || isUpdating}
            />
        </div>
    );
};

export default StudentList;