import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Input,
    Space,
    Typography,
    Button,
    Tag,
    Row,
    Col,
    message,
    Popconfirm,
    Modal,
    Form,
    Select,
    InputNumber
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentList.css';
import { calculateStudentYear, isEligibleForInternship, isEligibleForProject } from './utils/studentUtils';

const { Title } = Typography;
const { Option } = Select;

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortedInfo, setSortedInfo] = useState({});
    const [visible, setVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form] = Form.useForm();
    const [yearFilter, setYearFilter] = useState('all');

    const navigate = useNavigate();

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/students', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const studentOnly = response.data.filter(user => user.role === 'student');
            setStudents(studentOnly);
        } catch (error) {
            console.error('Error fetching students:', error);
            if (error.response?.status === 401) {
                message.error('กรุณาเข้าสู่ระบบใหม่');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handleAdd = async (values) => {
        try {
            const studentYear = calculateStudentYear(values.studentID);
            const totalCredits = parseInt(values.totalCredits) || 0;
            const majorCredits = parseInt(values.majorCredits) || 0;

            // คำนวณสิทธิ์
            const projectEligibility = isEligibleForProject(studentYear, totalCredits, majorCredits);
            const internshipEligibility = isEligibleForInternship(studentYear, totalCredits);

            const response = await axios.post('http://localhost:5000/api/students', {
                studentID: values.studentID,
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                totalCredits,
                majorCredits,
                isEligibleForInternship: internshipEligibility.eligible,
                isEligibleForProject: projectEligibility.eligible
            });

            if (response.status === 200) {
                message.success("เพิ่มนักศึกษาเรียบร้อย!");
                setVisible(false);
                form.resetFields();
                await fetchStudents();
            }
        } catch (error) {
            console.error('Error adding student:', error);
            message.error(error.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
        }
    };

    const handleEdit = async (values) => {
        try {
            const studentYear = calculateStudentYear(values.studentID);
            const totalCredits = parseInt(values.totalCredits) || 0;
            const majorCredits = parseInt(values.majorCredits) || 0;

            // คำนวณสิทธิ์
            const projectEligibility = isEligibleForProject(studentYear, totalCredits, majorCredits);
            const internshipEligibility = isEligibleForInternship(studentYear, totalCredits);

            const response = await axios.put(
                `http://localhost:5000/api/students/${editingStudent.studentID}`,
                {
                    totalCredits,
                    majorCredits,
                    isEligibleForInternship: internshipEligibility.eligible,
                    isEligibleForProject: projectEligibility.eligible
                }
            );

            if (response.status === 200) {
                message.success("แก้ไขข้อมูลนักศึกษาเรียบร้อย!");
                setVisible(false);
                form.resetFields();
                await fetchStudents();
            }
        } catch (error) {
            console.error('Error editing student:', error);
            message.error(error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        }
    };

    const handleAddOrEdit = async (values) => {
        if (editingStudent) {
            await handleEdit(values);
        } else {
            await handleAdd(values);
        }
    };

    const handleDelete = async (studentID) => {
        try {
            await axios.delete(`http://localhost:5000/api/students/${studentID}`);
            console.log('Deleted student ID:', studentID);
            message.success("ลบนักศึกษาเรียบร้อย!");
            fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    const openModal = (student = null) => {
        setEditingStudent(student);
        setVisible(true);
        if (student) {
            console.log('Student data before form set:', student);
            form.setFieldsValue({
                studentID: student.studentID,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                totalCredits: parseInt(student.totalCredits),
                majorCredits: parseInt(student.majorCredits)
            });
        } else {
            // กรณีเพิ่มใหม่
            form.setFieldsValue({
                studentID: '',
                firstName: '',
                lastName: '',
                email: '',
                totalCredits: 0,
                majorCredits: 0
            });
        }
    };

    const updateSummary = useCallback((data) => {
        const filtered = data.filter(student => {
            const matchesSearch = student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
                student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
                student.lastName?.toLowerCase().includes(searchText.toLowerCase());
            const matchesYear = yearFilter === 'all' || calculateStudentYear(student.studentID) === parseInt(yearFilter);
            return matchesSearch && matchesYear;
        });
        
        return {
            total: filtered.length,
            internshipEligible: filtered.filter(s => s.isEligibleForInternship).length,
            projectEligible: filtered.filter(s => s.isEligibleForProject).length
        };
    }, [searchText, yearFilter]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        // เมื่อ totalCredits เปลี่ยน ให้ตรวจสอบ majorCredits
        const majorCredits = form.getFieldValue('majorCredits');
        const totalCredits = form.getFieldValue('totalCredits');
        if (majorCredits > totalCredits) {
            form.setFieldsValue({ majorCredits: totalCredits });
        }
    }, [form.getFieldValue('totalCredits')]);

    const handleTableChange = (pagination, filters, sorter) => {
        setSortedInfo(sorter);
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.lastName?.toLowerCase().includes(searchText.toLowerCase());
            
        const matchesYear = yearFilter === 'all' || calculateStudentYear(student.studentID) === parseInt(yearFilter);
        
        return matchesSearch && matchesYear;
    });

    const tableHeaderStyle = {
        className: 'table-header'
    };

    const tableCellStyle = {
        className: 'table-cell'
    };

    const currentSummary = updateSummary(students);

    const columns = [
        {
            title: 'รหัสนักศึกษา',
            dataIndex: 'studentID',
            key: 'studentID',
            width: 140,
            fixed: 'left',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.studentID.localeCompare(b.studentID),
            sortOrder: sortedInfo.columnKey === 'studentID' && sortedInfo.order,
            render: text => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'ชื่อ',
            dataIndex: 'firstName',
            key: 'firstName',
            width: 150,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.firstName.localeCompare(b.firstName),
            sortOrder: sortedInfo.columnKey === 'firstName' && sortedInfo.order
        },
        {
            title: 'นามสกุล',
            dataIndex: 'lastName',
            key: 'lastName',
            width: 150,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.lastName.localeCompare(b.lastName),
            sortOrder: sortedInfo.columnKey === 'lastName' && sortedInfo.order
        },
        {
            title: 'ชั้นปี',
            key: 'year',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            render: (_, record) => {
                const year = calculateStudentYear(record.studentID);
                return <span>ปี {year}</span>;
            },
            sorter: (a, b) => calculateStudentYear(a.studentID) - calculateStudentYear(b.studentID),
            sortOrder: sortedInfo.columnKey === 'year' && sortedInfo.order,
        },
        {
            title: 'สถานะฝึกงาน',
            dataIndex: 'isEligibleForInternship',
            key: 'internship',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => Number(a.isEligibleForInternship) - Number(b.isEligibleForInternship),
            sortOrder: sortedInfo.columnKey === 'internship' && sortedInfo.order,
            render: isEligibleForInternship => (
                <Tag color={isEligibleForInternship ? 'success' : 'error'} style={{
                    minWidth: '80px',
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligibleForInternship ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
        {
            title: 'สถานะโปรเจค',
            dataIndex: 'isEligibleForProject',
            key: 'project',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => Number(a.isEligibleForProject) - Number(b.isEligibleForProject),
            sortOrder: sortedInfo.columnKey === 'project' && sortedInfo.order,
            render: isEligibleForProject => (
                <Tag color={isEligibleForProject ? 'success' : 'error'} style={{
                    minWidth: '80px',
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligibleForProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
        {
            title: "จัดการ",
            key: "actions",
            width: 130,
            align: 'center',
            render: (record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)}>
                        แก้ไข
                    </Button>
                    <Popconfirm title="คุณแน่ใจหรือไม่ที่จะลบ?" onConfirm={() => handleDelete(record.studentID)}>
                        <Button icon={<DeleteOutlined />} danger>
                            ลบ
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="container-studentlist">
            <Modal
                style={{ top: 30 }}
                open={visible}
                title={editingStudent ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษา"}
                okText={editingStudent ? "บันทึก" : "เพิ่ม"}
                cancelText="ยกเลิก"
                onCancel={() => {
                    setVisible(false);
                    form.resetFields();
                }}
                onOk={() => {
                    form.validateFields()
                        .then(values => {
                            if (editingStudent) {
                                handleEdit(values);
                            } else {
                                handleAdd(values);
                            }
                        })
                        .catch(info => console.log("Validation Failed:", info));
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="studentID" label="รหัสนักศึกษา" rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="firstName" label="ชื่อ" rules={[{ required: true, message: "กรุณากรอกชื่อนักศึกษา!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lastName" label="นามสกุล" rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="อีเมล" rules={[{ required: true, type: "email", message: "กรุณากรอกอีเมลที่ถูกต้อง!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="totalCredits" 
                        label="หน่วยกิตสะสม" 
                        rules={[
                            { required: true, message: "กรุณากรอกหน่วยกิตรวม!" },
                            {
                                validator: async (_, value) => {
                                    const numValue = parseInt(value);
                                    if (isNaN(numValue)) {
                                        throw new Error('กรุณากรอกตัวเลข');
                                    }
                                    if (numValue < 0) {
                                        throw new Error('หน่วยกิตต้องไม่ติดลบ');
                                    }
                                    if (numValue > 142) {
                                        throw new Error('หน่วยกิตรวมต้องไม่เกิน 142 หน่วยกิต');
                                    }
                                }
                            }
                        ]}
                    >
                        <InputNumber 
                            min={0} 
                            max={142}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item 
                        name="majorCredits" 
                        label="หน่วยกิตภาควิชา" 
                        dependencies={['totalCredits']}
                        rules={[
                            { required: true, message: "กรุณากรอกหน่วยกิตภาควิชา!" },
                            {
                                validator: async (_, value) => {
                                    const numValue = parseInt(value);
                                    const totalCredits = form.getFieldValue('totalCredits');
                                    
                                    if (isNaN(numValue)) {
                                        throw new Error('กรุณากรอกตัวเลข');
                                    }
                                    if (numValue < 0) {
                                        throw new Error('หน่วยกิตต้องไม่ติดลบ');
                                    }
                                    if (numValue > totalCredits) {
                                        throw new Error('หน่วยกิตภาควิชาต้องไม่เกินหน่วยกิตรวม');
                                    }
                                }
                            }
                        ]}
                    >
                        <InputNumber 
                            min={0} 
                            max={form.getFieldValue('totalCredits')}
                            style={{ width: '100%' }}
                            parser={value => parseInt(value) || 0}
                            formatter={value => `${value}`}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Row justify="space-between" align="middle">
                <Col flex="auto">
                    <Row gutter={40} align="middle">
                        <Col>
                            <Space style={{ fontSize: '14px' }}>
                                <UserOutlined />
                                <span>{currentSummary.total} คน</span>
                            </Space>
                        </Col>
                        <Col>
                            <Space style={{
                                fontSize: '14px',
                                color: '#52c41a'
                            }}>
                                <span>มีสิทธิ์ฝึกงาน {currentSummary.internshipEligible} คน</span>
                            </Space>
                        </Col>
                        <Col>
                            <Space style={{
                                fontSize: '14px',
                                color: '#1890ff'
                            }}>
                                <span>มีสิทธิ์ทำโปรเจค {currentSummary.projectEligible} คน</span>
                            </Space>
                        </Col>
                    </Row>
                </Col>
                <Col flex="none">
                    <Space size={16}>
                        <Input
                            placeholder="ค้นหาด้วยรหัสนักศึกษา, ชื่อ หรือนามสกุล"
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{
                                width: 300,
                                borderRadius: '6px'
                            }}
                        />
                        <Select 
                            defaultValue="all"
                            style={{ width: 120 }}
                            onChange={value => setYearFilter(value)}
                        >
                            <Option value="all">ทุกชั้นปี</Option>
                            <Option value="1">ปี 1</Option>
                            <Option value="2">ปี 2</Option>
                            <Option value="3">ปี 3</Option>
                            <Option value="4">ปี 4</Option>
                            <Option value="5">ปี 5</Option>
                        </Select>
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                fetchStudents();
                                setSortedInfo({});
                            }}
                            loading={loading}
                            style={{ borderRadius: '6px' }}
                        >
                            รีเฟรชข้อมูล
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() =>
                                openModal(null)
                            }
                        >
                            เพิ่มนักศึกษา
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={filteredStudents}
                rowKey="studentID"
                loading={loading}
                size="middle"
                onChange={handleTableChange}
                scroll={{
                    x: 1000,
                    y: 'calc(100vh - 350px)'
                }}
                sortDirections={['ascend', 'descend', 'ascend']}
            />
        </div>
    );
};

export default StudentList;