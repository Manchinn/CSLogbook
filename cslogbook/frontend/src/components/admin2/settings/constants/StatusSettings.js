// คอมโพเนนต์ย่อยสำหรับสถานะในระบบ
import React, { useState, useEffect } from 'react';
import {
    Form, Button, Card, Typography, Table, Input, Space,
    Row, Col, Select, Popconfirm, message, Tag, Tabs, InputNumber, Divider
} from 'antd';
import {
    SaveOutlined, ReloadOutlined, PlusOutlined,
    EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined,
    ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const StatusSettings = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [studentStatuses, setStudentStatuses] = useState([]);
    const [documentStatuses, setDocumentStatuses] = useState([]);
    const [editingStatus, setEditingStatus] = useState(null);
    const [newStatus, setNewStatus] = useState({
        id: '',
        name: '',
        color: 'default',
        category: 'student',
        description: ''
    });
    const [yearClassification, setYearClassification] = useState({
        normalYearsRange: 4,
        extendedYearsRange: 8,
        retiredStatus: 8
    });
    const [internshipSteps, setInternshipSteps] = useState([]);
    const [projectSteps, setProjectSteps] = useState([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await settingsService.getStatusSettings();
            if (response.success) {
                const studentStatusList = response.data.statuses.filter(s => s.category === 'student');
                const documentStatusList = response.data.statuses.filter(s => s.category === 'document');

                setStudentStatuses(studentStatusList);
                setDocumentStatuses(documentStatusList);

                // เพิ่มการโหลดข้อมูลสถานะตามชั้นปี
                if (response.data.yearClassification) {
                    setYearClassification(response.data.yearClassification);
                    
                    // ตั้งค่าในฟอร์ม
                    form.setFieldsValue({
                        normalYearsRange: response.data.yearClassification.normalYearsRange,
                        extendedYearsRange: response.data.yearClassification.extendedYearsRange,
                        retiredStatus: response.data.yearClassification.retiredStatus
                    });
                }

                // เพิ่มการโหลดข้อมูลขั้นตอนการทำงาน
                if (response.data.internshipSteps) {
                    setInternshipSteps(response.data.internshipSteps);
                    form.setFieldsValue({ internshipSteps: response.data.internshipSteps });
                }

                if (response.data.projectSteps) {
                    setProjectSteps(response.data.projectSteps);
                    form.setFieldsValue({ projectSteps: response.data.projectSteps });
                }
            } else {
                message.error('ไม่สามารถดึงข้อมูลการตั้งค่าได้');
            }
        } catch (error) {
            console.error('Error fetching status settings:', error);
            message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // ตรวจสอบข้อมูลในฟอร์ม
            const values = await form.validateFields();
            setLoading(true);
    
            // รวมรายการสถานะทั้งหมด
            const allStatuses = [...studentStatuses, ...documentStatuses];
    
            // ข้อมูลสถานะตามชั้นปี
            const yearClassificationData = {
                normalYearsRange: values.normalYearsRange,
                extendedYearsRange: values.extendedYearsRange,
                retiredStatus: values.retiredStatus
            };
    
            const response = await settingsService.updateStatusSettings({
                statuses: allStatuses,
                yearClassification: yearClassificationData,
                internshipSteps: values.internshipSteps,
                projectSteps: values.projectSteps
            });
    
            if (response.success) {
                message.success('บันทึกการตั้งค่าสำเร็จ');
                // อัปเดต state
                setYearClassification(yearClassificationData);
                setInternshipSteps(values.internshipSteps);
                setProjectSteps(values.projectSteps);
            } else {
                message.error('ไม่สามารถบันทึกการตั้งค่าได้');
            }
        } catch (error) {
            console.error('Error saving status settings:', error);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    // การจัดการกับสถานะนักศึกษา
    const handleAddStudentStatus = () => {
        if (!newStatus.id || !newStatus.name) {
            message.error('กรุณากรอกรหัสและชื่อสถานะ');
            return;
        }

        if (studentStatuses.some(status => status.id === newStatus.id) ||
            documentStatuses.some(status => status.id === newStatus.id)) {
            message.error('รหัสสถานะซ้ำกับที่มีอยู่แล้ว');
            return;
        }

        const statusToAdd = {
            ...newStatus,
            category: 'student'
        };

        setStudentStatuses([...studentStatuses, statusToAdd]);
        setNewStatus({ id: '', name: '', color: 'default', category: 'student', description: '' });
    };

    const handleEditStatus = (record, category) => {
        setEditingStatus(record.id);
    };

    const handleSaveEditStatus = (record, category) => {
        if (category === 'student') {
            const newStatuses = studentStatuses.map(status =>
                status.id === record.id ? record : status
            );
            setStudentStatuses(newStatuses);
        } else {
            const newStatuses = documentStatuses.map(status =>
                status.id === record.id ? record : status
            );
            setDocumentStatuses(newStatuses);
        }
        setEditingStatus(null);
    };

    const handleDeleteStatus = (id, category) => {
        if (category === 'student') {
            setStudentStatuses(studentStatuses.filter(status => status.id !== id));
        } else {
            setDocumentStatuses(documentStatuses.filter(status => status.id !== id));
        }
    };

    // การจัดการกับสถานะเอกสาร
    const handleAddDocumentStatus = () => {
        if (!newStatus.id || !newStatus.name) {
            message.error('กรุณากรอกรหัสและชื่อสถานะ');
            return;
        }

        if (studentStatuses.some(status => status.id === newStatus.id) ||
            documentStatuses.some(status => status.id === newStatus.id)) {
            message.error('รหัสสถานะซ้ำกับที่มีอยู่แล้ว');
            return;
        }

        const statusToAdd = {
            ...newStatus,
            category: 'document'
        };

        setDocumentStatuses([...documentStatuses, statusToAdd]);
        setNewStatus({ id: '', name: '', color: 'default', category: 'document', description: '' });
    };

    const colorOptions = [
        { label: 'ปกติ', value: 'default' },
        { label: 'น้ำเงิน', value: 'blue' },
        { label: 'เขียว', value: 'green' },
        { label: 'แดง', value: 'error' },
        { label: 'ส้ม', value: 'warning' },
        { label: 'เทา', value: 'processing' },
        { label: 'ม่วง', value: 'purple' },
        { label: 'เขียวอ่อน', value: 'success' },
        { label: 'ชมพู', value: 'pink' },
        { label: 'ฟ้า', value: 'cyan' }
    ];

    // คอลัมน์สำหรับตารางสถานะนักศึกษา
    const studentStatusColumns = [
        {
            title: 'รหัส',
            dataIndex: 'id',
            key: 'id',
            width: '20%',
            render: (text, record) =>
                editingStatus === record.id ? (
                    <Input
                        value={record.id}
                        onChange={e => {
                            const updated = [...studentStatuses];
                            const index = updated.findIndex(item => item.id === record.id);
                            updated[index] = { ...updated[index], id: e.target.value };
                            setStudentStatuses(updated);
                        }}
                    />
                ) : (
                    <Text code>{text}</Text>
                )
        },
        {
            title: 'ชื่อสถานะ',
            dataIndex: 'name',
            key: 'name',
            width: '25%',
            render: (text, record) =>
                editingStatus === record.id ? (
                    <Input
                        value={record.name}
                        onChange={e => {
                            const updated = [...studentStatuses];
                            const index = updated.findIndex(item => item.id === record.id);
                            updated[index] = { ...updated[index], name: e.target.value };
                            setStudentStatuses(updated);
                        }}
                    />
                ) : (
                    text
                )
        },
        {
            title: 'สี',
            dataIndex: 'color',
            key: 'color',
            width: '15%',
            render: (color, record) =>
                editingStatus === record.id ? (
                    <Select
                        value={color}
                        onChange={value => {
                            const updated = [...studentStatuses];
                            const index = updated.findIndex(item => item.id === record.id);
                            updated[index] = { ...updated[index], color: value };
                            setStudentStatuses(updated);
                        }}
                        style={{ width: '100%' }}
                    >
                        {colorOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    <Tag color={color}>{record.name}</Tag>
                )
        },
        {
            title: 'คำอธิบาย',
            dataIndex: 'description',
            key: 'description',
            width: '25%',
            render: (text, record) =>
                editingStatus === record.id ? (
                    <Input
                        value={text}
                        onChange={e => {
                            const updated = [...studentStatuses];
                            const index = updated.findIndex(item => item.id === record.id);
                            updated[index] = { ...updated[index], description: e.target.value };
                            setStudentStatuses(updated);
                        }}
                    />
                ) : (
                    text
                )
        },
        {
            title: 'จัดการ',
            key: 'action',
            width: '15%',
            render: (_, record) =>
                editingStatus === record.id ? (
                    <div>
                        <Button
                            icon={<CheckOutlined />}
                            type="link"
                            style={{ color: 'green' }}
                            onClick={() => handleSaveEditStatus(record, 'student')}
                        />
                        <Button
                            icon={<CloseOutlined />}
                            type="link"
                            style={{ color: 'red' }}
                            onClick={() => setEditingStatus(null)}
                        />
                    </div>
                ) : (
                    <div>
                        <Button
                            icon={<EditOutlined />}
                            type="link"
                            onClick={() => handleEditStatus(record, 'student')}
                        />
                        <Popconfirm
                            title="ต้องการลบสถานะนี้ใช่หรือไม่?"
                            onConfirm={() => handleDeleteStatus(record.id, 'student')}
                            okText="ใช่"
                            cancelText="ไม่"
                        >
                            <Button
                                icon={<DeleteOutlined />}
                                type="link"
                                danger
                            />
                        </Popconfirm>
                    </div>
                )
        }
    ];

    // คอลัมน์สำหรับตารางสถานะเอกสาร (ใช้โครงสร้างเดียวกับสถานะนักศึกษา)
    const documentStatusColumns = studentStatusColumns.map(column => {
        if (column.key === 'action') {
            return {
                ...column,
                render: (_, record) =>
                    editingStatus === record.id ? (
                        <div>
                            <Button
                                icon={<CheckOutlined />}
                                type="link"
                                style={{ color: 'green' }}
                                onClick={() => handleSaveEditStatus(record, 'document')}
                            />
                            <Button
                                icon={<CloseOutlined />}
                                type="link"
                                style={{ color: 'red' }}
                                onClick={() => setEditingStatus(null)}
                            />
                        </div>
                    ) : (
                        <div>
                            <Button
                                icon={<EditOutlined />}
                                type="link"
                                onClick={() => handleEditStatus(record, 'document')}
                            />
                            <Popconfirm
                                title="ต้องการลบสถานะนี้ใช่หรือไม่?"
                                onConfirm={() => handleDeleteStatus(record.id, 'document')}
                                okText="ใช่"
                                cancelText="ไม่"
                            >
                                <Button
                                    icon={<DeleteOutlined />}
                                    type="link"
                                    danger
                                />
                            </Popconfirm>
                        </div>
                    )
            };
        }
        if (column.dataIndex === 'id' || column.dataIndex === 'name' || column.dataIndex === 'description') {
            return {
                ...column,
                render: (text, record) =>
                    editingStatus === record.id ? (
                        <Input
                            value={text}
                            onChange={e => {
                                const updated = [...documentStatuses];
                                const index = updated.findIndex(item => item.id === record.id);
                                updated[index] = { ...updated[index], [column.dataIndex]: e.target.value };
                                setDocumentStatuses(updated);
                            }}
                        />
                    ) : (
                        column.dataIndex === 'id' ? <Text code>{text}</Text> : text
                    )
            };
        }
        if (column.dataIndex === 'color') {
            return {
                ...column,
                render: (color, record) =>
                    editingStatus === record.id ? (
                        <Select
                            value={color}
                            onChange={value => {
                                const updated = [...documentStatuses];
                                const index = updated.findIndex(item => item.id === record.id);
                                updated[index] = { ...updated[index], color: value };
                                setDocumentStatuses(updated);
                            }}
                            style={{ width: '100%' }}
                        >
                            {colorOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    ) : (
                        <Tag color={color}>{record.name}</Tag>
                    )
            };
        }
        return column;
    });

    return (
        <div className="status-settings">
            <Form form={form} layout="vertical">
                <Tabs defaultActiveKey="1">
                    <TabPane tab="สถานะในระบบ" key="1">
                        <Card className="setting-card">
                            <Title level={5}>สถานะนักศึกษา</Title>
                            <Text type="secondary">
                                กำหนดสถานะต่างๆ ของนักศึกษาที่ใช้ในระบบ
                            </Text>

                            <div className="add-status-section" style={{ marginTop: 16, marginBottom: 16 }}>
                                <Row gutter={8}>
                                    <Col span={5}>
                                        <Input
                                            placeholder="รหัสสถานะ"
                                            value={newStatus.id}
                                            onChange={e => setNewStatus({ ...newStatus, id: e.target.value })}
                                        />
                                    </Col>
                                    <Col span={7}>
                                        <Input
                                            placeholder="ชื่อสถานะ"
                                            value={newStatus.name}
                                            onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
                                        />
                                    </Col>
                                    <Col span={5}>
                                        <Select
                                            placeholder="เลือกสี"
                                            value={newStatus.color}
                                            onChange={value => setNewStatus({ ...newStatus, color: value })}
                                            style={{ width: '100%' }}
                                        >
                                            {colorOptions.map(option => (
                                                <Option key={option.value} value={option.value}>
                                                    {option.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col span={5}>
                                        <Input
                                            placeholder="คำอธิบาย"
                                            value={newStatus.description}
                                            onChange={e => setNewStatus({ ...newStatus, description: e.target.value })}
                                        />
                                    </Col>
                                    <Col span={2}>
                                        <Button
                                            type="primary"
                                            onClick={handleAddStudentStatus}
                                            icon={<PlusOutlined />}
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                </Row>
                            </div>

                            <Table
                                columns={studentStatusColumns}
                                dataSource={studentStatuses}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        </Card>

                        <Card className="setting-card" style={{ marginTop: 16 }}>
                            <Title level={5}>สถานะเอกสาร</Title>
                            <Text type="secondary">
                                กำหนดสถานะต่างๆ ของเอกสารที่ใช้ในระบบ
                            </Text>

                            <div className="add-status-section" style={{ marginTop: 16, marginBottom: 16 }}>
                                <Row gutter={8}>
                                    <Col span={5}>
                                        <Input
                                            placeholder="รหัสสถานะ"
                                            value={newStatus.id}
                                            onChange={e => setNewStatus({ ...newStatus, id: e.target.value })}
                                        />
                                    </Col>
                                    <Col span={7}>
                                        <Input
                                            placeholder="ชื่อสถานะ"
                                            value={newStatus.name}
                                            onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
                                        />
                                    </Col>
                                    <Col span={5}>
                                        <Select
                                            placeholder="เลือกสี"
                                            value={newStatus.color}
                                            onChange={value => setNewStatus({ ...newStatus, color: value })}
                                            style={{ width: '100%' }}
                                        >
                                            {colorOptions.map(option => (
                                                <Option key={option.value} value={option.value}>
                                                    {option.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col span={5}>
                                        <Input
                                            placeholder="คำอธิบาย"
                                            value={newStatus.description}
                                            onChange={e => setNewStatus({ ...newStatus, description: e.target.value })}
                                        />
                                    </Col>
                                    <Col span={2}>
                                        <Button
                                            type="primary"
                                            onClick={handleAddDocumentStatus}
                                            icon={<PlusOutlined />}
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                </Row>
                            </div>

                            <Table
                                columns={documentStatusColumns}
                                dataSource={documentStatuses}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        </Card>
                    </TabPane>

                    <TabPane tab="สถานะตามชั้นปี" key="2">
                        <Card className="setting-card">
                            <Title level={5}>สถานะตามชั้นปี</Title>
                            <Text type="secondary">
                                กำหนดสถานะของนักศึกษาตามชั้นปี
                            </Text>

                            <Row gutter={16} style={{ marginTop: 16 }}>
                                <Col span={8}>
                                    <Form.Item
                                        name="normalYearsRange"
                                        label="ชั้นปีปกติ"
                                        rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
                                    >
                                        <InputNumber min={1} max={4} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="extendedYearsRange"
                                        label="ชั้นปีตกค้าง (สูงสุด)"
                                        rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
                                    >
                                        <InputNumber min={5} max={10} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="retiredStatus"
                                        label="สถานะพ้นสภาพเมื่อเกินกี่ปี"
                                        rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
                                    >
                                        <InputNumber min={6} max={12} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </TabPane>

                    <TabPane tab="ขั้นตอนการทำงาน" key="3">
                        <Card className="setting-card">
                            <Title level={5}>ขั้นตอนการฝึกงาน</Title>
                            <Text type="secondary">
                                กำหนดขั้นตอนการทำงานสำหรับการฝึกงาน
                            </Text>

                            <Form.List name="internshipSteps">
                                {(fields, { add, remove, move }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => (
                                            <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                                                <Col span={1} style={{ textAlign: 'center' }}>
                                                    <Text strong>{index + 1}</Text>
                                                </Col>
                                                <Col span={5}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'stepId']}
                                                        rules={[{ required: true, message: 'กรุณากรอกรหัสขั้นตอน' }]}
                                                    >
                                                        <Input placeholder="รหัสขั้นตอน" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={10}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'name']}
                                                        rules={[{ required: true, message: 'กรุณากรอกชื่อขั้นตอน' }]}
                                                    >
                                                        <Input placeholder="ชื่อขั้นตอน" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'status']}
                                                        rules={[{ required: true, message: 'กรุณากรอกสถานะ' }]}
                                                    >
                                                        <Select
                                                            placeholder="เลือกสถานะ"
                                                            showSearch
                                                            optionFilterProp="children"
                                                        >
                                                            {studentStatuses.map(status => (
                                                                <Option key={status.id} value={status.name}>
                                                                    {status.name}
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={2}>
                                                    <Space>
                                                        <Button
                                                            type="text"
                                                            icon={<ArrowUpOutlined />}
                                                            disabled={index === 0}
                                                            onClick={() => move(index, index - 1)}
                                                        />
                                                        <Button
                                                            type="text"
                                                            icon={<ArrowDownOutlined />}
                                                            disabled={index === fields.length - 1}
                                                            onClick={() => move(index, index + 1)}
                                                        />
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(name)}
                                                        />
                                                    </Space>
                                                </Col>
                                            </Row>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            เพิ่มขั้นตอน
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </Card>

                        <Card className="setting-card" style={{ marginTop: 16 }}>
                            <Title level={5}>ขั้นตอนการทำโครงงาน</Title>
                            <Text type="secondary">
                                กำหนดขั้นตอนการทำงานสำหรับการทำโครงงาน
                            </Text>

                            <Form.List name="projectSteps">
                                {(fields, { add, remove, move }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => (
                                            <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                                                <Col span={1} style={{ textAlign: 'center' }}>
                                                    <Text strong>{index + 1}</Text>
                                                </Col>
                                                <Col span={5}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'stepId']}
                                                        rules={[{ required: true, message: 'กรุณากรอกรหัสขั้นตอน' }]}
                                                    >
                                                        <Input placeholder="รหัสขั้นตอน" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={10}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'name']}
                                                        rules={[{ required: true, message: 'กรุณากรอกชื่อขั้นตอน' }]}
                                                    >
                                                        <Input placeholder="ชื่อขั้นตอน" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'status']}
                                                        rules={[{ required: true, message: 'กรุณากรอกสถานะ' }]}
                                                    >
                                                        <Select
                                                            placeholder="เลือกสถานะ"
                                                            showSearch
                                                            optionFilterProp="children"
                                                        >
                                                            {studentStatuses.map(status => (
                                                                <Option key={status.id} value={status.name}>
                                                                    {status.name}
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={2}>
                                                    <Space>
                                                        <Button
                                                            type="text"
                                                            icon={<ArrowUpOutlined />}
                                                            disabled={index === 0}
                                                            onClick={() => move(index, index - 1)}
                                                        />
                                                        <Button
                                                            type="text"
                                                            icon={<ArrowDownOutlined />}
                                                            disabled={index === fields.length - 1}
                                                            onClick={() => move(index, index + 1)}
                                                        />
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(name)}
                                                        />
                                                    </Space>
                                                </Col>
                                            </Row>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            เพิ่มขั้นตอน
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </Card>
                    </TabPane>
                </Tabs>

                <div className="setting-actions">
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchSettings}
                        disabled={loading}
                        style={{ marginRight: 8 }}
                    >
                        รีเซ็ต
                    </Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={loading}
                    >
                        บันทึกการตั้งค่า
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default StatusSettings;