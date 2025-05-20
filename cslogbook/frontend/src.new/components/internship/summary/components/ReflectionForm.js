import React from 'react';
import { Card, Form, Input, Button } from 'antd';

// นำเข้า CSS
import '../styles/ReflectionForm.css'; // Adjusted import path

const ReflectionForm = () => {
    return (
        <Card>
            <Form>
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Please input the title!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Description"
                    name="description"
                    rules={[{ required: true, message: 'Please input the description!' }]}
                >
                    <Input.TextArea />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default ReflectionForm;