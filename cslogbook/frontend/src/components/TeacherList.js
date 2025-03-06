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
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentList.css';

const { Title } = Typography;
const { Option } = Select;

const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined in environment variables');
}

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortedInfo, setSortedInfo] = useState({});
    const [visible, setVisible] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [form] = Form.useForm();

    const navigate = useNavigate();

    const fetchTeachers = useCallback(async () => {
        setLoading(true);   
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/teachers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const teacherOnly = response.data.filter(user => user.role === 'teacher');
            setTeachers(teacherOnly);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            if (error.response?.status === 401) {
                message.error('กรุณาเข้าสู่ระบบใหม่');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handleAddOrEdit = async (values) => {
        try {
            if (editingTeacher) {
                await axios.put(`${API_URL}/teachers/${editingTeacher.sName}`, {
                    ...values
                });
                console.log('Edited teacher:', values);
                message.success("แก้ไขข้อมูลอาจารย์เรียบร้อย!");
            } else {
                await axios.post(`${API_URL}/teachers`, {
                    ...values
                });
                console.log('Added teacher:', values);
                message.success("เพิ่มอาจารย์เรียบร้อย!");
            }
            fetchTeachers();
            setVisible(false);
            setEditingTeacher(null);
        } catch (error) {
            console.error('Error saving teacher data:', error);
            if (error.response?.status === 404) {
                message.error("ไม่พบข้อมูลอาจารย์");
            } else {
                message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        }
    };

    const handleDelete = async (sName) => {
        try {
            await axios.delete(`${API_URL}/teachers/${sName}`);
            console.log('Deleted teacher shortname:', sName);
            message.success("ลบอาจารย์เรียบร้อย!");
            fetchTeachers();
        } catch (error) {
            console.error('Error deleting teacher:', error);
            message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    const openModal = (teacher = null) => {
        setEditingTeacher(teacher);
        setVisible(true);
        form.setFieldsValue(teacher ? {
            ...teacher
        } : { sName: '', firstName: '', lastName: '', email: '' });
    };

    const updateSummary = useCallback((data) => {
        const filteredData = data.filter(teacher =>
            teacher.sName?.toLowerCase().includes(searchText.toLowerCase()) ||
            teacher.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
            teacher.lastName?.toLowerCase().includes(searchText.toLowerCase())
        );
        return {
            total: filteredData.length
        };
    }, [searchText]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const handleTableChange = (pagination, filters, sorter) => {
        setSortedInfo(sorter);
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.sName?.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.lastName?.toLowerCase().includes(searchText.toLowerCase())
    );

    const tableHeaderStyle = {
        className: 'table-header'
    };

    const tableCellStyle = {
        className: 'table-cell'
    };

    const currentSummary = updateSummary(teachers);

    const columns = [
        {
            title: 'ตัวย่อ',
            dataIndex: 'sName',
            key: 'sName',
            width: 140,
            fixed: 'left',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.sName.localeCompare(b.sName),
            sortOrder: sortedInfo.columnKey === 'sName' && sortedInfo.order,
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
            title: "จัดการ",
            key: "actions",
            width: 130,
            align: 'center',
            render: (record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)}>
                        แก้ไข
                    </Button>
                    <Popconfirm title="คุณแน่ใจหรือไม่ที่จะลบ?" onConfirm={() => handleDelete(record.sName)}>
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
                title={editingTeacher ? "แก้ไขข้อมูลอาจารย์" : "เพิ่มอาจารย์"}
                okText={editingTeacher ? "บันทึก" : "เพิ่ม"}
                cancelText="ยกเลิก"
                onCancel={() => setVisible(false)}
                onOk={() => {
                    form.validateFields()
                        .then(values => {
                            handleAddOrEdit(values);
                            form.resetFields();
                        })
                        .catch(info => console.log("Validation Failed:", info));
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="sName" label="ตัวย่อ" rules={[{ required: true, message: "กรุณากรอกตัวย่อ!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="firstName" label="ชื่อ" rules={[{ required: true, message: "กรุณากรอกชื่ออาจารย์!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lastName" label="นามสกุล" rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="อีเมล" rules={[{ required: true, type: "email", message: "กรุณากรอกอีเมลที่ถูกต้อง!" }]}>
                        <Input />
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
                    </Row>
                </Col>
                <Col flex="none">
                    <Space size={16}>
                        <Input
                            placeholder="ค้นหาด้วยตัวย่อ, ชื่อ หรือนามสกุล"
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{
                                width: 300,
                                borderRadius: '6px'
                            }}
                        />
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                fetchTeachers();
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
                            เพิ่มอาจารย์
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={filteredTeachers}
                rowKey="sName"
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

export default TeacherList;