import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Input, Space, Typography, Button, Row, Col, message, Popconfirm, Modal, Form
} from 'antd';
import {
    SearchOutlined, ReloadOutlined, UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '../services/teacherService';
import './StudentList.css';

const { Title } = Typography;

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
            const response = await teacherService.getAllTeachers();
            setTeachers(response);
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
                await teacherService.updateTeacher(editingTeacher.teacherCode, values);
                message.success("แก้ไขข้อมูลอาจารย์เรียบร้อย!");
            } else {
                await teacherService.addTeacher(values);
                message.success("เพิ่มอาจารย์เรียบร้อย!");
            }
            fetchTeachers();
            setVisible(false);
            setEditingTeacher(null);
        } catch (error) {
            console.error('Error saving teacher data:', error);
            message.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    const handleDelete = async (teacherCode) => {
        try {
            await teacherService.deleteTeacher(teacherCode);
            message.success("ลบอาจารย์เรียบร้อย!");
            fetchTeachers();
        } catch (error) {
            console.error('Error deleting teacher:', error);
            message.error(error.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    const openModal = (teacher = null) => {
        setEditingTeacher(teacher);
        setVisible(true);
        form.setFieldsValue(teacher ? {
            teacherCode: teacher.teacherCode,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            contactExtension: teacher.contactExtension
        } : {});
    };

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const handleTableChange = (pagination, filters, sorter) => {
        setSortedInfo(sorter);
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.teacherCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.lastName?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'รหัสอาจารย์',
            dataIndex: 'teacherCode',
            key: 'teacherCode',
            width: 140,
            fixed: 'left',
            sorter: (a, b) => a.teacherCode.localeCompare(b.teacherCode),
            sortOrder: sortedInfo.columnKey === 'teacherCode' && sortedInfo.order,
            render: text => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'ชื่อ',
            dataIndex: 'firstName',
            key: 'firstName',
            width: 150,
            sorter: (a, b) => a.firstName.localeCompare(b.firstName),
            sortOrder: sortedInfo.columnKey === 'firstName' && sortedInfo.order
        },
        {
            title: 'นามสกุล',
            dataIndex: 'lastName',
            key: 'lastName',
            width: 150,
            sorter: (a, b) => a.lastName.localeCompare(b.lastName),
            sortOrder: sortedInfo.columnKey === 'lastName' && sortedInfo.order
        },
        {
            title: 'อีเมล',
            dataIndex: 'email',
            key: 'email',
            width: 200
        },
        {
            title: 'เบอร์ภายใน',
            dataIndex: 'contactExtension',
            key: 'contactExtension',
            width: 120
        },
        {
            title: "จัดการ",
            key: "actions",
            width: 130,
            fixed: 'right',
            align: 'center',
            render: (record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)}>
                        แก้ไข
                    </Button>
                    <Popconfirm 
                        title="ยืนยันการลบข้อมูล"
                        description="คุณแน่ใจหรือไม่ที่จะลบข้อมูลอาจารย์?"
                        onConfirm={() => handleDelete(record.teacherCode)}
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        okButtonProps={{ danger: true }}
                    >
                        <Button icon={<DeleteOutlined />} danger>
                            ลบ
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        }
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
                    <Form.Item 
                        name="teacherCode" 
                        label="รหัสอาจารย์" 
                        rules={[{ required: true, message: "กรุณากรอกรหัสอาจารย์!" }]}
                    >
                        <Input disabled={!!editingTeacher} />
                    </Form.Item>
                    <Form.Item 
                        name="firstName" 
                        label="ชื่อ" 
                        rules={[{ required: true, message: "กรุณากรอกชื่ออาจารย์!" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="lastName" 
                        label="นามสกุล" 
                        rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="email" 
                        label="อีเมล" 
                        rules={[
                            { required: true, message: "กรุณากรอกอีเมล!" },
                            { type: "email", message: "กรุณากรอกอีเมลที่ถูกต้อง!" }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="contactExtension"
                        label="เบอร์ภายใน"
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Space>
                        <UserOutlined />
                        <span>{filteredTeachers.length} คน</span>
                    </Space>
                </Col>
                <Col>
                    <Space size={16}>
                        <Input
                            placeholder="ค้นหาด้วยรหัส, ชื่อ หรือนามสกุล"
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
                            onClick={() => openModal(null)}
                        >
                            เพิ่มอาจารย์
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={filteredTeachers}
                rowKey="teacherCode"
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