import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Row, Col, message,
    Typography, Modal, Select, Form, notification
} from 'antd';
import { userService } from '../../../../services/admin/userService';
import { STUDENT_STATUS } from '../../../../utils/adminConstants';
import './styles.css';
import { calculateStudentYear, isEligibleForInternship, isEligibleForProject } from '../../../../utils/studentUtils';

// นำเข้าคอมโพเนนต์และ utils ที่มีอยู่แล้ว
import StudentStatistics from './components/StudentStatistics';
import StudentFilters from './components/StudentFilters';
import StudentTable from './components/StudentTable';
import StudentDrawer from './components/StudentDrawer';

const { Text } = Typography;
const { Option } = Select;

const StudentList = () => {
    // State variables
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [academicYear, setAcademicYear] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [form] = Form.useForm();
    
    // สร้างตัวเลือกปีการศึกษา
    const academicYearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear() + 543;
        return Array.from({ length: 5 }, (_, i) => ({
            value: currentYear - i,
            label: `${currentYear - i}`
        }));
    }, []);

    // Fetch students function
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchText) params.search = searchText;
            if (statusFilter) params.status = statusFilter;
            if (academicYear) params.academicYear = academicYear;

            const response = await userService.getAllStudents(params);

            if (response.success && Array.isArray(response.data)) {
                setStudents(response.data);
            } else {
                console.error('Invalid response format:', response);
                message.error('รูปแบบข้อมูลไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            message.error('ไม่สามารถโหลดข้อมูลนักศึกษา: ' + (error.message || 'เกิดข้อผิดพลาด'));
        } finally {
            setLoading(false);
        }
    }, [searchText, statusFilter, academicYear]);

    // Load students on mount and when filters change
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // รีเซ็ตฟอร์มและตั้งค่าฟอร์มเมื่อเลือกนักศึกษาเพื่อแก้ไข
    useEffect(() => {
        if (selectedStudent && editMode) {
            form.setFieldsValue({
                studentCode: selectedStudent.studentCode,
                firstName: selectedStudent.firstName,
                lastName: selectedStudent.lastName,
                email: selectedStudent.email,
                totalCredits: selectedStudent.totalCredits || 0,
                majorCredits: selectedStudent.majorCredits || 0
            });
        } else if (!selectedStudent) {
            form.resetFields();
        }
    }, [selectedStudent, editMode, form]);

    // กรองข้อมูลนักศึกษา
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = !searchText ||
                student.studentCode?.toLowerCase().includes(searchText.toLowerCase()) ||
                student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
                student.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
                `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchText.toLowerCase());

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

    // Event handlers
    const handleAddStudent = () => {
        setSelectedStudent(null);
        setEditMode(true);
        form.resetFields();
        setDrawerVisible(true);
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setEditMode(false);
        setDrawerVisible(true);
    };

    const handleEditStudent = () => {
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
    };

    const handleSaveStudent = async () => {
        try {
            const values = await form.validateFields();

            if (values.majorCredits > values.totalCredits) {
                message.error('หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม');
                return;
            }

            if (values.studentCode) {
                const studentYear = calculateStudentYear(values.studentCode);
                if (!studentYear.error) {
                    const internshipStatus = isEligibleForInternship(studentYear.year, values.totalCredits);
                    const projectStatus = isEligibleForProject(studentYear.year, values.totalCredits, values.majorCredits);
                    
                    notification.info({
                        message: 'ข้อมูลสิทธิ์หลังปรับปรุง',
                        description: 
                            `การเปลี่ยนแปลงนี้จะส่งผลให้นักศึกษา${internshipStatus.eligible ? ' "มีสิทธิ์ฝึกงาน"' : ' "ไม่มีสิทธิ์ฝึกงาน"'} 
                            และ${projectStatus.eligible ? ' "มีสิทธิ์ทำโครงงาน"' : ' "ไม่มีสิทธิ์ทำโครงงาน"'}`,
                        duration: 4
                    });
                }
            }

            if (selectedStudent) {
                const response = await userService.updateStudent(selectedStudent.studentCode, values);
                message.success('อัปเดตข้อมูลนักศึกษาสำเร็จ');
                setSelectedStudent({
                    ...selectedStudent,
                    ...response.data
                });
            } else {
                await userService.addStudent(values);
                message.success('เพิ่มนักศึกษาสำเร็จ');
                setDrawerVisible(false);
            }
            setEditMode(false);
            fetchStudents();
        } catch (error) {
            console.error('Error saving student:', error);
            message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleDeleteStudent = async (studentCode) => {
        try {
            Modal.confirm({
                title: 'ยืนยันการลบข้อมูล',
                content: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนักศึกษานี้? การดำเนินการนี้ไม่สามารถเรียกคืนได้',
                okText: 'ลบ',
                okType: 'danger',
                cancelText: 'ยกเลิก',
                onOk: async () => {
                    await userService.deleteStudent(studentCode);
                    message.success('ลบข้อมูลนักศึกษาสำเร็จ');
                    if (selectedStudent && selectedStudent.studentCode === studentCode) {
                        setDrawerVisible(false);
                    }
                    fetchStudents();
                }
            });
        } catch (error) {
            console.error('Error deleting student:', error);
            message.error(error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setEditMode(false);
    };

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
                        onAddStudent={handleAddStudent}
                        loading={loading}
                    />
                </Col>
            </Row>

            <StudentTable
                students={filteredStudents}
                loading={loading}
                onView={handleViewStudent}
                onEdit={(student) => {
                    setSelectedStudent(student);
                    setEditMode(true);
                    setDrawerVisible(true);
                }}
                onDelete={handleDeleteStudent}
            />

            {/* ใช้ StudentDrawer Component แทนที่โค้ด Drawer เดิม */}
            <StudentDrawer 
                visible={drawerVisible}
                student={selectedStudent}
                editMode={editMode}
                form={form}
                onClose={handleCloseDrawer}
                onEdit={handleEditStudent}
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveStudent}
            />
        </div>
    );
};

export default StudentList;