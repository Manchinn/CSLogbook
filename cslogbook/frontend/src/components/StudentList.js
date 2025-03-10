import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table,
    Input,
    Space,
    Button,
    Tag,
    Row,
    Col,
    message,
    Modal,
    Form,
    Typography,
    Select
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { studentService } from '../services/studentService';
import './StudentList.css';

const { Text } = Typography;

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form] = Form.useForm();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [semester, setSemester] = useState(null);
    const [academicYear, setAcademicYear] = useState(null);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // สร้างตัวเลือกปีการศึกษา (ย้อนหลัง 5 ปี)
    const academicYearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear() + 543;
        return Array.from({ length: 5 }, (_, i) => ({
            value: currentYear - i,
            label: `${currentYear - i}`
        }));
    }, []);

    // ปรับปรุง state สำหรับ filter options
    const [filterOptions, setFilterOptions] = useState({
        semesters: [],
        academicYears: []
    });

    // ฟังก์ชันดึงข้อมูลนักศึกษา
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (semester) params.append('semester', semester);
            if (academicYear) params.append('academicYear', academicYear);

            const response = await studentService.getAllStudents(params);

            // ปรับปรุงการตรวจสอบโครงสร้างข้อมูล
            if (!response || (!Array.isArray(response) && !Array.isArray(response.data))) {
                console.error('Invalid response format:', response);
                throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
            }

            // ปรับปรุงการแปลงข้อมูล
            const data = Array.isArray(response) ? response : response.data;
            const formattedData = data.map(student => ({
                studentCode: student.studentCode || '',
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                totalCredits: student.student?.totalCredits || student.totalCredits || 0,
                majorCredits: student.student?.majorCredits || student.majorCredits || 0,
                isEligibleForInternship: Boolean(student.student?.isEligibleInternship || student.isEligibleForInternship),
                isEligibleForProject: Boolean(student.student?.isEligibleProject || student.isEligibleForProject),
                semester: student.semester,
                academicYear: student.academicYear
            }));

            console.log('Formatted data:', formattedData); // เพิ่ม logging
            setStudents(formattedData);

        } catch (error) {
            console.error('Error fetching students:', error);
            message.error('ไม่สามารถโหลดข้อมูลนักศึกษา: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [semester, academicYear]);

    // โหลดข้อมูลเมื่อ component mount
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // เพิ่ม useEffect สำหรับโหลด filter options
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const options = await studentService.getFilterOptions();
                console.log('Loaded filter options:', options); // เพิ่ม logging
                setFilterOptions(options);
            } catch (error) {
                console.error('Error loading filter options:', error);
                message.error('ไม่สามารถโหลดตัวเลือกการกรอง');
            }
        };
        loadFilterOptions();
    }, []);

    // จัดการการเพิ่มนักศึกษา
    const handleAdd = () => {
        setEditingStudent(null);
        form.resetFields();
        setModalVisible(true);
    };

    // จัดการการแก้ไขข้อมูล
    const handleEdit = (student) => {
        setEditingStudent(student);
        form.setFieldsValue(student);
        setModalVisible(true);
    };

    // จัดการการบันทึกข้อมูล
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingStudent) {
                // แก้ไขข้อมูล
                await studentService.updateStudentAdmin(editingStudent.studentCode, values);
                message.success('แก้ไขข้อมูลสำเร็จ');
            } else {
                // เพิ่มข้อมูลใหม่
                await studentService.addStudent(values);
                message.success('เพิ่มข้อมูลสำเร็จ');
            }
            setModalVisible(false);
            form.resetFields();
            fetchStudents(); // รีเฟรชข้อมูล
        } catch (error) {
            message.error('เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    // จัดการการลบข้อมูล
    const handleDelete = async (studentCode) => {
        Modal.confirm({
            title: 'ยืนยันการลบข้อมูล',
            content: 'คุณแน่ใจหรือไม่ที่จะลบข้อมูลนักศึกษานี้?',
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    await studentService.deleteStudentAdmin(studentCode);
                    message.success('ลบข้อมูลสำเร็จ');
                    fetchStudents(); // รีเฟรชข้อมูล
                } catch (error) {
                    message.error('ไม่สามารถลบข้อมูล: ' + error.message);
                }
            }
        });
    };

    // รีเฟรชข้อมูล
    const handleRefresh = () => {
        fetchStudents();
    };

    // ปรับปรุงฟังก์ชัน filteredStudents
    const filteredStudents = useMemo(() => {
        if (!searchText) return students;

        const searchLower = searchText.toLowerCase();
        return students.filter(student =>
            student.studentCode?.toLowerCase().includes(searchLower) ||
            student.firstName?.toLowerCase().includes(searchLower) ||
            student.lastName?.toLowerCase().includes(searchLower) ||
            `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchLower)
        );
    }, [students, searchText]);

    // แก้ไข columns definition ให้เรียบง่ายขึ้น
    const columns = useMemo(() => [
        {
            title: 'รหัสนักศึกษา',
            dataIndex: 'studentCode',
            key: 'studentCode',
            width: 140,
            fixed: 'left',
            sorter: (a, b) => (a.studentCode || '').localeCompare(b.studentCode || '')
        },
        {
            title: 'ชื่อ-นามสกุล',
            dataIndex: 'firstName',
            key: 'fullName',
            width: 200,
            render: (_, record) => (
                <Text strong>
                    {record.firstName && record.lastName
                        ? `${record.firstName} ${record.lastName}`
                        : '-'}
                </Text>
            )
        },
        {
            title: 'หน่วยกิต',
            key: 'credits',
            width: 100,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>สะสม: {record.totalCredits ?? 0}</Text>
                    <Text type="secondary">ภาควิชา: {record.majorCredits ?? 0}</Text>
                </Space>
            )
        },
        {
            title: 'สิทธิ์การฝึกงาน',
            key: 'internship',
            width: 130,
            align: 'center',
            render: (_, record) => (
                <Tag color={record.isEligibleForInternship ? 'success' : 'error'}>
                    {record.isEligibleForInternship ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
        {
            title: 'สิทธิ์โครงงาน',
            key: 'project',
            width: 130,
            align: 'center',
            render: (_, record) => (
                <Tag color={record.isEligibleForProject ? 'success' : 'error'}>
                    {record.isEligibleForProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
        {
            title: 'จัดการ',
            key: 'actions',
            width: 150,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        แก้ไข
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.studentCode)}
                    >
                        ลบ
                    </Button>
                </Space>
            )
        }
    ], [filterOptions]);

    // เพิ่ม Filter Component
    const FilterSection = () => (
        <Space>
            <Select
                placeholder="ภาคเรียน"
                allowClear
                style={{ width: 150 }}
                onChange={setSemester}
                value={semester}
            >
                {filterOptions.semesters?.map(sem => (
                    <Select.Option key={sem.value} value={sem.value}>
                        {sem.label}
                    </Select.Option>
                ))}
            </Select>
            <Select
                placeholder="ปีการศึกษา"
                allowClear
                style={{ width: 150 }}
                onChange={setAcademicYear}
                value={academicYear}
            >
                {filterOptions.academicYears?.map(year => (
                    <Select.Option key={year.value} value={year.value}>
                        {year.label}
                    </Select.Option>
                ))}
            </Select>
        </Space>
    );

    return (
        <>
            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />
            <div className="container-studentlist">
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col flex="auto" style={{ maxWidth: 500 }}>
                        <Input.Search
                            placeholder="ค้นหาด้วยรหัสนักศึกษา หรือ ชื่อ-นามสกุล"
                            allowClear
                            size="large"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onSearch={(value) => setSearchText(value)}
                            enterButton={<SearchOutlined />}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col>
                        <Space>
                            <FilterSection />
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefresh}
                                loading={loading}
                                size="large"
                            >
                                รีเฟรช
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAdd}
                                size="large"
                            >
                                เพิ่มนักศึกษา
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredStudents}
                    rowKey="studentCode"
                    loading={{
                        spinning: loading,
                        tip: 'กำลังโหลดข้อมูล...',
                        size: 'large'
                    }}
                    scroll={{ x: 800 }}
                    locale={{
                        emptyText: loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลนักศึกษา'
                    }}
                />

                <Modal
                    title={editingStudent ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษา"}
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={() => {
                        setModalVisible(false);
                        form.resetFields();
                    }}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="studentCode"
                            label="รหัสนักศึกษา"
                            rules={[{ required: true, message: 'กรุณากรอกรหัสนักศึกษา' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="firstName"
                            label="ชื่อ"
                            rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="lastName"
                            label="นามสกุล"
                            rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
};

export default StudentList;