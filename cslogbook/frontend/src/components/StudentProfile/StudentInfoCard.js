import React from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Space,
  Spin,
  Alert,
  Avatar,
  Tag,
  Divider,
} from "antd";
import { UserOutlined, IdcardOutlined, MailOutlined } from "@ant-design/icons";
import useStudentInfo from "../../hooks/useStudentInfo";
import "./StudentInfoCard.css"; // เพิ่ม import CSS 