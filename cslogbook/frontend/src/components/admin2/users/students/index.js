import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, Input, Space, Button, Tag, Row, Col, message,
    Typography, Tooltip, Modal, Drawer, Segmented, Select, Form, InputNumber, Divider, notification
} from 'antd';
import {
    SearchOutlined, ReloadOutlined, UserAddOutlined,
    UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, BookOutlined, 
    ProjectOutlined, SaveOutlined, CloseOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { userService } from '../../../../services/admin/userService';
import { STUDENT_STATUS } from '../../../../utils/adminConstants';
import './styles.css';
import { calculateStudentYear, isEligibleForInternship, isEligibleForProject } from '../../../../utils/studentUtils';

// นำเข้าคอมโพเนนต์และ utils ที่มีอยู่แล้ว
import StudentDetail from './components/StudentDetail';
import StudentStatistics from './components/StudentStatistics';
import StudentFilters from './components/StudentFilters';
import StudentTable from './components/StudentTable';
import { getStatusTags } from './utils/statusHelpers';

const { Text } = Typography;
const { Option } = Select;

const StudentList = () => {
    // State variables
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
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

    const handleUploadSuccess = () => {
        setUploadModalVisible(false);
        fetchStudents();
        message.success('อัปโหลดข้อมูลนักศึกษาสำเร็จ');
    };

    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setEditMode(false);
    };

    // เตรียมปุ่มสำหรับ drawer header
    const drawerExtra = editMode ? (
        <Space>
            <Button onClick={handleCancelEdit} icon={<CloseOutlined />}>
                ยกเลิก
            </Button>
            <Button type="primary" onClick={handleSaveStudent} icon={<SaveOutlined />}>
                บันทึก
            </Button>
        </Space>
    ) : (
        <Button
            type="primary"
            onClick={handleEditStudent}
            icon={<EditOutlined />}
        >
            แก้ไขข้อมูล
        </Button>
    );

    return (
        <div className="admin-student-container">
            <Row justify="space-between" align="middle" className="filter-section">
                <Col>
                    {/* ใช้ StudentStatistics Component */}
                    <StudentStatistics statistics={statistics} />
                </Col>
                <Col>
                    {/* ใช้ StudentFilters Component */}
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
                        onUpload={() => setUploadModalVisible(true)}
                        loading={loading}
                    />
                </Col>
            </Row>

            {/* ใช้ StudentTable Component */}
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

            {/* Drawer สำหรับดูและแก้ไขข้อมูลนักศึกษา */}
            <Drawer
                title={editMode ? (selectedStudent ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษา') : 'ข้อมูลนักศึกษา'}
                placement="right"
                width={520}
                onClose={handleCloseDrawer}
                open={drawerVisible}
                className="student-drawer"
                extra={drawerExtra}
            >
                {editMode ? (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ totalCredits: 0, majorCredits: 0 }}
                        className="student-form"
                    >
                        <Form.Item
                            name="studentCode"
                            label="รหัสนักศึกษา"
                            rules={[
                                { required: true, message: 'กรุณากรอกรหัสนักศึกษา' },
                                { pattern: /^\d{13}$/, message: 'รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก' }
                            ]}
                        >
                            <Input disabled={!!selectedStudent} placeholder="รหัสนักศึกษา 13 หลัก" />
                        </Form.Item>

                        <Form.Item
                            name="firstName"
                            label="ชื่อ"
                            rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
                        >
                            <Input placeholder="ชื่อ" />
                        </Form.Item>

                        <Form.Item
                            name="lastName"
                            label="นามสกุล"
                            rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}
                        >
                            <Input placeholder="นามสกุล" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="อีเมล"
                            rules={[
                                { required: true, message: 'กรุณากรอกอีเมล' },
                                { type: 'email', message: 'อีเมลไม่ถูกต้อง' }
                            ]}
                        >
                            <Input placeholder="อีเมล" />
                        </Form.Item>

                        <Form.Item
                            name="totalCredits"
                            label="หน่วยกิตรวม"
                            rules={[
                                { required: true, message: 'กรุณากรอกหน่วยกิตรวม' },
                                { type: 'number', min: 0, max: 200, message: 'หน่วยกิตต้องอยู่ระหว่าง 0-200' }
                            ]}
                        >
                            <InputNumber min={0} max={200} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="majorCredits"
                            label="หน่วยกิตภาควิชา"
                            rules={[
                                { required: true, message: 'กรุณากรอกหน่วยกิตภาควิชา' },
                                { type: 'number', min: 0, max: 200 },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('totalCredits') >= value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('หน่วยกิตภาควิชาต้องน้อยกว่าหรือเท่ากับหน่วยกิตรวม'));
                                    }
                                })
                            ]}
                            dependencies={['totalCredits']}
                        >
                            <InputNumber min={0} max={200} style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                ) : (
                    selectedStudent && <StudentDetail student={selectedStudent} />
                )}
            </Drawer>
        </div>
    );
};

export default StudentList;