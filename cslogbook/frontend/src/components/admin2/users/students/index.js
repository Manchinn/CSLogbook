import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, Input, Space, Button, Tag, Row, Col, message,
    Typography, Tooltip, Modal, Drawer, Segmented, Select, Form, InputNumber
} from 'antd';
import {
    SearchOutlined, ReloadOutlined, UserAddOutlined,
    UploadOutlined, FileExcelOutlined, EyeOutlined,
    EditOutlined, DeleteOutlined, BookOutlined, ProjectOutlined,
    SaveOutlined, CloseOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { userService } from '../../../../services/admin/userService';
import { STUDENT_STATUS } from '../../../../utils/adminConstants';
import BulkUpload from './BulkUpload';
import './styles.css';

const { Text } = Typography;
const { Option } = Select;

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [academicYear, setAcademicYear] = useState(null);
    const [editMode, setEditMode] = useState(false); // เพิ่มสถานะสำหรับโหมดแก้ไข
    const [form] = Form.useForm(); // เพิ่ม form instance
    const [filterOptions, setFilterOptions] = useState({
        semesters: [],
        academicYears: []
    });

    // สร้างตัวเลือกปีการศึกษา (ย้อนหลัง 5 ปี)
    const academicYearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear() + 543;
        return Array.from({ length: 5 }, (_, i) => ({
            value: currentYear - i,
            label: `${currentYear - i}`
        }));
    }, []);

    // Fetch students
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchText) params.search = searchText;
            if (statusFilter) params.status = statusFilter;
            if (academicYear) params.academicYear = academicYear;

            // ใช้ userService.getAllStudents แทน studentService
            const response = await userService.getAllStudents(params);

            if (response.success && Array.isArray(response.data)) {
                // แมปข้อมูลเพื่อให้มั่นใจว่ามีฟิลด์ status
                const processedStudents = response.data.map(student => {
                    // ถ้า API ยังไม่ส่ง status มา ให้กำหนดจาก boolean fields
                    if (!student.status) {
                        if (student.isEligibleForProject) {
                            student.status = STUDENT_STATUS.ELIGIBLE_PROJECT;
                        } else if (student.isEligibleForInternship) {
                            student.status = STUDENT_STATUS.ELIGIBLE_INTERNSHIP;
                        }
                    }
                    return student;
                });

                setStudents(processedStudents);
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

    // Load filter options
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                // ใช้ userService.getFilterOptions แทน studentService
                const options = await userService.getFilterOptions();
                setFilterOptions(options.data || {
                    semesters: [],
                    academicYears: []
                });
            } catch (error) {
                console.error('Error loading filter options:', error);
            }
        };
        loadFilterOptions();
    }, []);

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

    // ปรับปรุงฟังก์ชัน filteredStudents เพื่อกรองข้อมูลในฝั่ง client
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // กรองตามข้อความค้นหา
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
                    // ใช้ boolean fields ถ้าไม่มี status
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
        const noEligibilityCount = filteredStudents.filter(s => 
            !s.isEligibleForInternship && 
            !s.isEligibleForProject && 
            s.status !== STUDENT_STATUS.ELIGIBLE_INTERNSHIP &&
            s.status !== STUDENT_STATUS.ELIGIBLE_PROJECT &&
            s.status !== STUDENT_STATUS.IN_PROGRESS_INTERNSHIP &&
            s.status !== STUDENT_STATUS.IN_PROGRESS_PROJECT &&
            s.status !== STUDENT_STATUS.COMPLETED_INTERNSHIP &&
            s.status !== STUDENT_STATUS.COMPLETED_PROJECT
        ).length;
        
        return {
            total: filteredStudents.length,
            eligibleInternship: filteredStudents.filter(s => 
                s.status === STUDENT_STATUS.ELIGIBLE_INTERNSHIP || 
                (!s.status && s.isEligibleForInternship)
            ).length,
            eligibleProject: filteredStudents.filter(s => 
                s.status === STUDENT_STATUS.ELIGIBLE_PROJECT || 
                (!s.status && s.isEligibleForProject)
            ).length,
            noEligibility: noEligibilityCount,
            inProgress: filteredStudents.filter(s => 
                s.status === STUDENT_STATUS.IN_PROGRESS_INTERNSHIP || 
                s.status === STUDENT_STATUS.IN_PROGRESS_PROJECT
            ).length
        };
    }, [filteredStudents]);

    // เปิด drawer เพื่อเพิ่มนักศึกษาใหม่
    const handleAddStudent = () => {
        setSelectedStudent(null);
        setEditMode(true);
        form.resetFields();
        setDrawerVisible(true);
    };

    // เปิด drawer เพื่อดูข้อมูลนักศึกษา
    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setEditMode(false);
        setDrawerVisible(true);
    };

    // เปลี่ยนเป็นโหมดแก้ไขข้อมูลนักศึกษา
    const handleEditStudent = () => {
        setEditMode(true);
    };

    // ยกเลิกการแก้ไข กลับไปโหมดดูข้อมูล
    const handleCancelEdit = () => {
        setEditMode(false);
    };

    // บันทึกข้อมูลหลังการแก้ไข
    const handleSaveStudent = async () => {
        try {
            const values = await form.validateFields();

            // ตรวจสอบความถูกต้องของหน่วยกิต
            if (values.majorCredits > values.totalCredits) {
                message.error('หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม');
                return;
            }

            if (selectedStudent) {
                // Update existing student
                await userService.updateStudent(selectedStudent.id, values);
                message.success('อัปเดตข้อมูลนักศึกษาสำเร็จ');
                // อัปเดตข้อมูลในตัวแปร selectedStudent เพื่อแสดงข้อมูลที่อัปเดตแล้ว
                setSelectedStudent({
                    ...selectedStudent,
                    ...values
                });
            } else {
                // Add new student
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

    // Handle student deletion
    const handleDeleteStudent = async (studentId) => {
        try {
            Modal.confirm({
                title: 'ยืนยันการลบข้อมูล',
                content: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนักศึกษานี้? การดำเนินการนี้ไม่สามารถเรียกคืนได้',
                okText: 'ลบ',
                okType: 'danger',
                cancelText: 'ยกเลิก',
                onOk: async () => {
                    await userService.deleteStudent(studentId);
                    message.success('ลบข้อมูลนักศึกษาสำเร็จ');
                    // ถ้า drawer กำลังแสดงข้อมูลนักศึกษาที่ถูกลบ ให้ปิด drawer
                    if (selectedStudent && selectedStudent.id === studentId) {
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

    // Handle bulk upload
    const handleUploadSuccess = () => {
        setUploadModalVisible(false);
        fetchStudents();
        message.success('อัปโหลดข้อมูลนักศึกษาสำเร็จ');
    };

    // รีเซ็ตฟิลเตอร์
    const handleResetFilters = () => {
        setSearchText('');
        setStatusFilter('');
        setAcademicYear(null);
    };

    // ปิด drawer
    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setEditMode(false);
    };

    // รับค่าสถานะเป็นข้อความภาษาไทย
    const getStatusText = (status) => {
        // ถ้าไม่มี status ให้ตรวจสอบจาก boolean fields ของ selectedStudent
        if (!status && selectedStudent) {
            if (selectedStudent.isEligibleForProject) {
                return 'มีสิทธิ์ทำโครงงาน';
            } else if (selectedStudent.isEligibleForInternship) {
                return 'มีสิทธิ์ฝึกงาน';
            } else {
                return 'ไม่มีสิทธิ์'; // เพิ่มเงื่อนไขนี้เพื่อแสดง "ไม่มีสิทธิ์" แทน "ไม่ระบุ"
            }
        }

        switch (status) {
            case STUDENT_STATUS.ELIGIBLE_INTERNSHIP:
                return 'มีสิทธิ์ฝึกงาน';
            case STUDENT_STATUS.ELIGIBLE_PROJECT:
                return 'มีสิทธิ์ทำโครงงาน';
            case STUDENT_STATUS.IN_PROGRESS_INTERNSHIP:
                return 'กำลังฝึกงาน';
            case STUDENT_STATUS.IN_PROGRESS_PROJECT:
                return 'กำลังทำโครงงาน';
            case STUDENT_STATUS.COMPLETED_INTERNSHIP:
                return 'ฝึกงานเสร็จสิ้น';
            case STUDENT_STATUS.COMPLETED_PROJECT:
                return 'โครงงานเสร็จสิ้น';
            default:
                return 'ไม่มีสิทธิ์'; // เปลี่ยนจาก 'ไม่ระบุ' เป็น 'ไม่มีสิทธิ์'
        }
    };

    // Table columns
    const columns = useMemo(() => [
        {
            title: 'รหัสนักศึกษา',
            dataIndex: 'studentCode',
            key: 'studentCode',
            sorter: (a, b) => a.studentCode?.localeCompare(b.studentCode || ''),
            width: 130,
            fixed: 'left',
        },
        {
            title: 'ชื่อ-นามสกุล',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (_, record) => (
                <Text strong>{`${record.firstName || ''} ${record.lastName || ''}`}</Text>
            ),
            sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
            width: 180,
        },
        {
            title: 'หน่วยกิต',
            key: 'credits',
            width: 120,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>สะสม: {record.totalCredits || 0}</Text>
                    <Text type="secondary">ภาควิชา: {record.majorCredits || 0}</Text>
                </Space>
            ),
        },
        {
            title: 'สถานะ',
            key: 'status',
            width: 200, // เพิ่มความกว้างเพื่อให้แสดงได้หลายแท็ก
            render: (_, record) => {
                // สร้างรายการแท็กที่จะแสดง
                const tags = [];

                // ตรวจสอบสถานะจาก status field
                if (record.status) {
                    switch (record.status) {
                        case STUDENT_STATUS.ELIGIBLE_INTERNSHIP:
                            tags.push({ color: 'blue', text: 'มีสิทธิ์ฝึกงาน' });
                            break;
                        case STUDENT_STATUS.ELIGIBLE_PROJECT:
                            tags.push({ color: 'green', text: 'มีสิทธิ์ทำโครงงาน' });
                            break;
                        case STUDENT_STATUS.IN_PROGRESS_INTERNSHIP:
                            tags.push({ color: 'processing', text: 'กำลังฝึกงาน' });
                            break;
                        case STUDENT_STATUS.IN_PROGRESS_PROJECT:
                            tags.push({ color: 'processing', text: 'กำลังทำโครงงาน' });
                            break;
                        case STUDENT_STATUS.COMPLETED_INTERNSHIP:
                            tags.push({ color: 'success', text: 'ฝึกงานเสร็จสิ้น' });
                            break;
                        case STUDENT_STATUS.COMPLETED_PROJECT:
                            tags.push({ color: 'success', text: 'โครงงานเสร็จสิ้น' });
                            break;
                        default:
                            break;
                    }
                }
                // ตรวจสอบจาก boolean fields ถ้าไม่มี status
                else {
                    if (record.isEligibleForProject) {
                        tags.push({ color: 'green', text: 'มีสิทธิ์ทำโครงงาน' });
                    }

                    if (record.isEligibleForInternship) {
                        tags.push({ color: 'blue', text: 'มีสิทธิ์ฝึกงาน' });
                    }
                }

                // ถ้าไม่มีสถานะใดๆ เลย
                if (tags.length === 0) {
                    tags.push({ color: 'error', text: 'ไม่มีสิทธิ์' });
                }

                // แสดงแท็กทั้งหมด
                return (
                    <Space size={4} wrap>
                        {tags.map((tag, index) => (
                            <Tag color={tag.color} key={index}>
                                {tag.text}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'จัดการ',
            key: 'actions',
            width: 180,
            fixed: 'right',
            render: (_, record) => (
                <Space className="action-buttons">
                    <Tooltip title="ดูข้อมูล">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewStudent(record)}
                        />
                    </Tooltip>
                    <Tooltip title="แก้ไข">
                        <Button
                            icon={<EditOutlined />}
                            type="primary"
                            onClick={() => {
                                setSelectedStudent(record);
                                setEditMode(true);
                                setDrawerVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="ลบ">
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => handleDeleteStudent(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ], []);

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
                    <div className="statistics-chips">
                        <div className="statistic-item">
                            <UserAddOutlined /> 
                            <Text strong>นักศึกษาทั้งหมด: {statistics.total} คน</Text>
                        </div>
                        <div className="statistic-item">
                            <BookOutlined />
                            <Text>มีสิทธิ์ฝึกงาน: {statistics.eligibleInternship}</Text>
                        </div>
                        <div className="statistic-item">
                            <ProjectOutlined />
                            <Text>มีสิทธิ์โครงงาน: {statistics.eligibleProject}</Text>
                        </div>
                        <div className="statistic-item">
                            <CloseCircleOutlined />
                            <Text>ไม่มีสิทธิ์: {statistics.noEligibility}</Text>
                        </div>
                    </div>
                </Col>
                <Col>
                    <Space size="small" wrap>
                        <Input
                            placeholder="ค้นหาด้วยรหัส, ชื่อ หรือนามสกุล"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                            allowClear
                        />
                        <Select
                            placeholder="ปีการศึกษา"
                            style={{ width: 150 }}
                            onChange={setAcademicYear}
                            value={academicYear}
                            allowClear
                        >
                            {academicYearOptions.map(year => (
                                <Option key={year.value} value={year.value}>
                                    {year.label}
                                </Option>
                            ))}
                        </Select>
                        <Segmented
                            options={[
                                { label: 'ทั้งหมด', value: '' },
                                { label: 'มีสิทธิ์ฝึกงาน', value: STUDENT_STATUS.ELIGIBLE_INTERNSHIP },
                                { label: 'มีสิทธิ์โครงงาน', value: STUDENT_STATUS.ELIGIBLE_PROJECT }
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => fetchStudents()}
                            loading={loading}
                        >
                            รีเฟรช
                        </Button>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={() => setUploadModalVisible(true)}
                        >
                            อัปโหลด CSV
                        </Button>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={handleAddStudent}
                        >
                            เพิ่มนักศึกษา
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={filteredStudents}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: total => `ทั้งหมด ${total} รายการ`
                }}
                scroll={{ x: 'max-content' }}
                locale={{
                    emptyText: loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลนักศึกษา'
                }}
                onRow={(record) => ({
                    onClick: () => handleViewStudent(record)
                })}
            />

            {/* Bulk Upload Modal */}
            <BulkUpload
                visible={uploadModalVisible}
                onCancel={() => setUploadModalVisible(false)}
                onSuccess={handleUploadSuccess}
            />

            {/* Combined Student Detail and Edit Drawer */}
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
                    selectedStudent && (
                        <div className="student-detail">
                            <p><strong>รหัสนักศึกษา:</strong> {selectedStudent.studentCode}</p>
                            <p><strong>ชื่อ-นามสกุล:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                            <p><strong>อีเมล:</strong> {selectedStudent.email || '-'}</p>
                            <p><strong>หน่วยกิตสะสม:</strong> {selectedStudent.totalCredits || 0}</p>
                            <p><strong>หน่วยกิตภาควิชา:</strong> {selectedStudent.majorCredits || 0}</p>
                            <p>
                                <strong>สถานะ:</strong> {getStatusText(selectedStudent.status)}
                            </p>
                        </div>
                    )
                )}
            </Drawer>
        </div>
    );
};

export default StudentList;