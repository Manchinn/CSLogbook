// CreditsGuideModal.js
import React from 'react';
import { Modal, Row, Col } from 'antd';
import CreditsImage from "../../image/Credits.png";
import CreditsImage2 from "../../image/Credits2.png";
import './styles.css';

const CreditsGuideModal = ({ visible, onOk, onCancel }) => {
  return (
    <Modal
      title="วิธีการตรวจสอบหน่วยกิตใน Reg KMUTNB"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="ตกลง"
      cancelText="ย้อนกลับ"
      width={600}
      style={{ top: 20 }}
    >
      <p>ขั้นตอนการตรวจสอบหน่วยกิตของท่าน</p>

      <Row gutter={16}>
        <Col span={12}>
          <p>
            <strong>1. หน่วยกิตที่สะสม</strong>
          </p>
          <ul>
            <li>
              <strong>เข้าสู่ระบบ</strong> Reg KMUTNB
            </li>
            <li>
              ไปที่เมนู <strong>ข้อมูลผลการศึกษา</strong>
            </li>
            <li>
              เลือก <strong>ตรวจสอบจบ</strong>
            </li>
            <li>
              <strong>ดูหน่วยกิตที่ผ่าน</strong>
            </li>
          </ul>
        </Col>

        <Col span={12}>
          <strong>วิธีการตรวจสอบ : หน่วยกิตที่สะสม</strong>
          <img
            src={CreditsImage}
            alt="รูปภาพประกอบ"
            style={{
              width: "100%",
              borderRadius: "8px",
              display: "block",
              margin: "auto",
            }}
          />
        </Col>
      </Row>
      
      <br />
      
      <Row gutter={16}>
        <Col span={12}>
          <p>
            <strong>2.หน่วยกิตรวมวิชาภาค (รายวิชา 0406xxxxx)</strong>
          </p>
          <ul>
            <li>
              <strong>เข้าสู่ระบบ</strong> Reg KMUTNB
            </li>
            <li>
              ไปที่เมนู <strong>ข้อมูลผลการศึกษา</strong>
            </li>
            <li>
              เลือก <strong>ตรวจสอบจบ</strong>
            </li>
            <li>
              <strong>แสดงรายวิชาทั้งหลักสูตร </strong>
            </li>
            <li>
              <strong>นำ </strong>หน่วยกิตวิชาบังคับและหน่วยกิตวิชาเลือกมารวมกัน
            </li>
          </ul>
        </Col>

        <Col span={12}>
          <strong>วิธีการตรวจสอบ : หน่วยกิตรวมวิชาภาค</strong>
          <img
            src={CreditsImage2}
            alt="รูปภาพประกอบ"
            style={{
              width: "100%",
              borderRadius: "8px",
              display: "block",
              margin: "auto",
            }}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default CreditsGuideModal;