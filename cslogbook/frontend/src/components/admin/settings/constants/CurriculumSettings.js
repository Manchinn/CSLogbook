import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Card,
  Typography,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  message,
  Modal,
  Switch,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { settingsService } from "../../../../services/admin/settingsService";

const { Title, Text } = Typography;

const CurriculumSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" หรือ "edit"

  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getCurriculums();
      console.log("API Response:", response); // ตรวจสอบข้อมูลที่ได้จาก API
      if (response.success) {
        const mappedCurriculums = response.data.map((curriculum) => ({
          id: curriculum.curriculumId,
          code: curriculum.code,
          name: curriculum.name,
          shortName: curriculum.shortName,
          startYear: curriculum.startYear,
          endYear: curriculum.end_year,
          active: curriculum.active,
          maxCredits: curriculum.maxCredits ?? curriculum.max_credits,
          totalCredits: curriculum.totalCredits,
          majorCredits: curriculum.majorCredits,
          internshipBaseCredits: curriculum.internshipBaseCredits,
          projectBaseCredits: curriculum.projectBaseCredits,
          projectMajorBaseCredits: curriculum.projectMajorBaseCredits,
        }));
        console.log("Mapped Curriculums:", mappedCurriculums); // ตรวจสอบข้อมูลที่แมปแล้ว
        setCurriculums(mappedCurriculums);
      } else {
        message.error("ไม่สามารถดึงข้อมูลหลักสูตรได้");
        console.log("Fetched curriculums (error):", response.data);
      }
    } catch (error) {
      console.error("Error fetching curriculums:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values) => {
    try {
      setLoading(true);
      console.log("Adding curriculum with values:", values); // ตรวจสอบค่าที่ส่งจากฟอร์ม
      const payload = {
        code: values.code,
        name: values.name,
        short_name: values.shortName,
        start_year: values.startYear,
        end_year: values.endYear,
        active: values.active || false,
        max_credits: values.maxCredits,
        total_credits: values.totalCredits,
        major_credits: values.majorCredits,
        internship_base_credits: values.internshipBaseCredits,
        project_base_credits: values.projectBaseCredits,
        project_major_base_credits: values.projectMajorBaseCredits,
      };
      console.log("Payload for adding:", payload); // ตรวจสอบ payload ที่จะส่งไปยัง API
      const response = await settingsService.createCurriculum(payload);
      console.log("API Response (Add):", response); // ตรวจสอบผลลัพธ์จาก API
      if (response.success) {
        message.success("เพิ่มหลักสูตรสำเร็จ");
        setAddModalVisible(false);
        form.resetFields();
        fetchCurriculums();
      } else {
        message.error("ไม่สามารถเพิ่มหลักสูตรได้");
      }
    } catch (error) {
      console.error("Error creating curriculum:", error);
      message.error("เกิดข้อผิดพลาดในการเพิ่มหลักสูตร");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values) => {
    try {
      setLoading(true);
      console.log("Editing curriculum with values:", values); // ตรวจสอบค่าที่ส่งจากฟอร์ม

      // ตรวจสอบว่ามีหลักสูตรที่เปิดใช้งานอย่างน้อย 1 อัน
      if (!values.active) {
        const activeCurriculums = curriculums.filter(
          (curriculum) => curriculum.active && curriculum.id !== values.id
        );
        if (activeCurriculums.length === 0) {
          message.error("ต้องมีหลักสูตรที่เปิดใช้งานอย่างน้อย 1 อัน");
          setLoading(false);
          return;
        }
      }

      const payload = {
        id: values.id,
        code: values.code,
        name: values.name,
        short_name: values.shortName,
        start_year: values.startYear,
        end_year: values.endYear,
        active: values.active || false,
        max_credits: values.maxCredits,
        total_credits: values.totalCredits,
        major_credits: values.majorCredits,
        internship_base_credits: values.internshipBaseCredits,
        project_base_credits: values.projectBaseCredits,
        project_major_base_credits: values.projectMajorBaseCredits,
      };
      console.log("Payload for editing:", payload); // ตรวจสอบ payload ที่จะส่งไปยัง API
      const response = await settingsService.updateCurriculum(
        values.id,
        payload
      );
      console.log("API Response (Edit):", response); // ตรวจสอบผลลัพธ์จาก API
      if (response.success) {
        message.success("แก้ไขหลักสูตรสำเร็จ");
        setAddModalVisible(false);
        form.resetFields();
        fetchCurriculums();
      } else {
        message.error("ไม่สามารถแก้ไขหลักสูตรได้");
      }
    } catch (error) {
      console.error("Error editing curriculum:", error);
      message.error("เกิดข้อผิดพลาดในการแก้ไขหลักสูตร");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      message.error("ไม่สามารถลบหลักสูตรได้: ID ไม่ถูกต้อง");
      return;
    }

    // ตรวจสอบว่าหลักสูตรที่ลบเป็นหลักสูตรที่เปิดใช้งาน และมีหลักสูตรที่เปิดใช้งานเหลืออยู่หรือไม่
    const deletingCurriculum = curriculums.find(
      (curriculum) => curriculum.id === id
    );
    if (deletingCurriculum?.active) {
      const activeCurriculums = curriculums.filter(
        (curriculum) => curriculum.active && curriculum.id !== id
      );
      if (activeCurriculums.length === 0) {
        message.error("ต้องมีหลักสูตรที่เปิดใช้งานอย่างน้อย 1 อัน");
        return;
      }
    }
    console.log("Deleting curriculum with ID:", id); // ตรวจสอบค่า id
    try {
      setLoading(true);
      const response = await settingsService.deleteCurriculum(id);
      console.log("API Response (Delete):", response); // ตรวจสอบผลลัพธ์จาก API
      if (response.success) {
        message.success("ลบหลักสูตรสำเร็จ");
        fetchCurriculums();
      } else {
        message.error("ไม่สามารถลบหลักสูตรได้");
      }
    } catch (error) {
      console.error("Error deleting curriculum:", error);
      message.error("เกิดข้อผิดพลาดในการลบหลักสูตร");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "รหัสหลักสูตร",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "ชื่อย่อหลักสูตร",
      dataIndex: "shortName",
      key: "shortName",
      width: 180,
    },
    {
      title: "ปีที่เริ่มใช้",
      dataIndex: "startYear",
      key: "startYear",
      width: 100,
    },
    {
      title: "ปีที่สิ้นสุด",
      dataIndex: "endYear",
      key: "endYear",
      width: 100,
      render: (text) => text || "ปัจจุบัน",
    },
    {
      title: "สถานะ",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (active) => (
        <Tag color={active ? "green" : "gray"}>
          {active ? "ใช้งาน" : "ไม่ใช้งาน"}
        </Tag>
      ),
    },
    {
      title: "หน่วยกิตสูงสุด",
      dataIndex: "maxCredits",
      key: "maxCredits",
      width: 120,
    } /* 
    {
      title: "หน่วยกิตสะสม",
      dataIndex: "totalCredits",
      key: "totalCredits",
      width: 120,
    },
    {
      title: "หน่วยกิตแต่ละวิชาภาค",
      dataIndex: "majorCredits",
      key: "majorCredits",
      width: 150,
    }, */,
    {
      title: "หน่วยกิตสะสมขั้นต่ำ (ฝึกงาน)",
      dataIndex: "internshipBaseCredits",
      key: "internshipBaseCredits",
      width: 120,
    },
    {
      title: "หน่วยกิตสะสมขั้นต่ำ (โครงงานพิเศษ)",
      dataIndex: "projectBaseCredits",
      key: "projectBaseCredits",
      width: 120,
    },
    {
      title: "หน่วยกิตวิชาภาคขั้นต่ำ (โครงงานพิเศษ)",
      dataIndex: "projectMajorBaseCredits",
      key: "projectMajorBaseCredits",
      width: 120,
    },
    {
      title: "จัดการ",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              console.log("Editing record:", record); // ตรวจสอบข้อมูล record
              setFormMode("edit");
              setAddModalVisible(true);
              form.setFieldsValue({
                id: record.id,
                code: record.code,
                name: record.name,
                shortName: record.shortName,
                startYear: record.startYear,
                endYear: record.endYear,
                active: record.active,
                maxCredits: record.maxCredits,/* 
                totalCredits: record.totalCredits,
                majorCredits: record.majorCredits, */
                internshipBaseCredits: record.internshipBaseCredits,
                projectBaseCredits: record.projectBaseCredits,
                projectMajorBaseCredits: record.projectMajorBaseCredits,
              });
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => {
              console.log("Deleting record ID:", record.id); // ตรวจสอบค่า id
              Modal.confirm({
                title: "ยืนยันการลบ",
                content: `คุณต้องการลบหลักสูตร "${record.code}" หรือไม่?`,
                okText: "ลบ",
                okType: "danger",
                cancelText: "ยกเลิก",
                onOk: () => handleDelete(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="curriculum-settings">
      <Card className="settings-card">
        <div className="card-title-with-button">
          <Title level={5}>หลักสูตรของสาขาวิชา</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              console.log("Opening Add Modal"); // ตรวจสอบการเปิด Modal
              setFormMode("add");
              setAddModalVisible(true);
              form.resetFields();
            }}
          >
            เพิ่มหลักสูตรใหม่
          </Button>
        </div>
        <Text type="secondary">
          กำหนดหลักสูตรที่ใช้ในสาขาวิชาและเกณฑ์ต่างๆ สำหรับแต่ละหลักสูตร
        </Text>

        <Table
          columns={columns}
          dataSource={curriculums}
          rowKey="id"
          loading={loading}
          pagination={false}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Modal
        title={formMode === "add" ? "เพิ่มหลักสูตรใหม่" : "แก้ไขหลักสูตร"}
        open={addModalVisible}
        onCancel={() => {
          console.log("Closing Modal"); // ตรวจสอบการปิด Modal
          setAddModalVisible(false);
        }}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ maxHeight: 650, overflowY: "auto" }}
          onFinish={(values) => {
            console.log("Form submitted with values:", values); // ตรวจสอบค่าที่ส่งจากฟอร์ม
            if (formMode === "add") {
              handleAdd(values);
            } else if (formMode === "edit") {
              handleEdit(values);
            }
          }}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="รหัสหลักสูตร"
            name="code"
            rules={[{ required: true, message: "กรุณากรอกรหัสหลักสูตร" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="ชื่อหลักสูตร"
            name="name"
            rules={[{ required: true, message: "กรุณากรอกชื่อหลักสูตร" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="ชื่อย่อหลักสูตร"
            name="shortName"
            rules={[{ required: true, message: "กรุณากรอกชื่อย่อหลักสูตร" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="ปีที่เริ่มใช้"
            name="startYear"
            rules={[{ required: true, message: "กรุณากรอกปีที่เริ่มใช้" }]}
          >
            <InputNumber min={2500} max={3000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="ปีที่สิ้นสุด" name="endYear">
            <InputNumber min={2500} max={3000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="จำนวนหน่วยกิตที่เรียนตลอดหลักสูตร"
            name="maxCredits"
            rules={[{ required: true, message: "กรุณากรอกหน่วยกิตสูงสุด" }]}
          >
            <InputNumber min={0} max={500} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="หน่วยกิตสะสมขั้นต่ำ (ระบบฝึกงาน)"
            name="internshipBaseCredits"
            rules={[
              {
                required: true,
                message: "กรุณากรอกหน่วยกิตสะสมขั้นต่ำ (ฝึกงาน)",
              },
            ]}
          >
            <InputNumber min={0} max={500} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="หน่วยกิตสะสมขั้นต่ำ (โครงงานพิเศษ)"
            name="projectBaseCredits"
            rules={[
              {
                required: true,
                message: "กรุณากรอกหน่วยกิตสะสมขั้นต่ำ (โครงงานพิเศษ)",
              },
            ]}
          >
            <InputNumber min={0} max={500} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="หน่วยกิตแต่ละวิชาภาคขั้นต่ำ (โครงงานพิเศษ)"
            name="projectMajorBaseCredits"
            rules={[
              {
                required: true,
                message: "กรุณากรอกหน่วยกิตแต่ละวิชาภาคขั้นต่ำ (โครงงานพิเศษ)",
              },
            ]}
          >
            <InputNumber min={0} max={500} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="สถานะ" name="active" valuePropName="checked">
            <Switch checkedChildren="ใช้งาน" unCheckedChildren="ไม่ใช้งาน" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              บันทึก
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CurriculumSettings;
