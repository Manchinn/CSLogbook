import React from 'react';
import {
  FileTextOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  FormOutlined,
  BugOutlined
} from '@ant-design/icons';

/**
 * Project 2 (Thesis) Step Definitions
 * Maps step keys to Thai labels, descriptions, and icons
 */
export const PROJECT2_STEP_DEFINITIONS = {
  THESIS_PROPOSAL_SUBMITTED: {
    key: 'THESIS_PROPOSAL_SUBMITTED',
    label: 'ยื่นหัวข้อปริญญานิพนธ์',
    description: 'เสนอหัวข้อและรายละเอียดปริญญานิพนธ์',
    icon: <FileTextOutlined style={{ fontSize: '16px' }} />,
    color: '#1890ff'
  },
  THESIS_IN_PROGRESS: {
    key: 'THESIS_IN_PROGRESS',
    label: 'ดำเนินโครงงาน/ปริญญานิพนธ์',
    description: 'พัฒนาและดำเนินการตามแผนที่วางไว้',
    icon: <SyncOutlined spin style={{ fontSize: '16px' }} />,
    color: '#52c41a'
  },
  THESIS_PROGRESS_CHECKINS: {
    key: 'THESIS_PROGRESS_CHECKINS',
    label: 'บันทึกความคืบหน้า',
    description: 'บันทึกการพบอาจารย์ที่ปรึกษาเป็นประจำ',
    icon: <FormOutlined style={{ fontSize: '16px' }} />,
    color: '#faad14'
  },
  THESIS_SYSTEM_TEST: {
    key: 'THESIS_SYSTEM_TEST',
    label: 'ทดสอบระบบ',
    description: 'ขอทดสอบระบบปริญญานิพนธ์กับคณะกรรมการ',
    icon: <BugOutlined style={{ fontSize: '16px' }} />,
    color: '#722ed1'
  },
  THESIS_DEFENSE_REQUEST: {
    key: 'THESIS_DEFENSE_REQUEST',
    label: 'ยื่นขอสอบปริญญานิพนธ์',
    description: 'ยื่นเอกสารขอสอบป้องกันปริญญานิพนธ์',
    icon: <TrophyOutlined style={{ fontSize: '16px' }} />,
    color: '#eb2f96'
  },
  THESIS_DEFENSE_RESULT: {
    key: 'THESIS_DEFENSE_RESULT',
    label: 'ผลการสอบปริญญานิพนธ์',
    description: 'ได้รับผลการสอบป้องกันปริญญานิพนธ์',
    icon: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
    color: '#fa8c16'
  },
  THESIS_FINAL_SUBMISSION: {
    key: 'THESIS_FINAL_SUBMISSION',
    label: 'ส่งเล่มสมบูรณ์',
    description: 'ส่งเอกสารเล่มสมบูรณ์ที่แก้ไขเรียบร้อยแล้ว',
    icon: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
    color: '#52c41a'
  }
};

/**
 * Project 1 Step Definitions (for comparison)
 */
export const PROJECT1_STEP_DEFINITIONS = {
  PROJECT1_TEAM_READY: {
    key: 'PROJECT1_TEAM_READY',
    label: 'ทีมพร้อม',
    description: 'รวมทีมและยื่นหัวข้อโครงงาน',
    icon: <FileTextOutlined style={{ fontSize: '16px' }} />,
    color: '#1890ff'
  },
  PROJECT1_IN_PROGRESS: {
    key: 'PROJECT1_IN_PROGRESS',
    label: 'ดำเนินโครงงาน',
    description: 'พัฒนาโครงงานตามแผน',
    icon: <SyncOutlined spin style={{ fontSize: '16px' }} />,
    color: '#52c41a'
  },
  PROJECT1_PROGRESS_CHECKINS: {
    key: 'PROJECT1_PROGRESS_CHECKINS',
    label: 'บันทึกความคืบหน้า',
    description: 'บันทึกการพบอาจารย์ที่ปรึกษา',
    icon: <FormOutlined style={{ fontSize: '16px' }} />,
    color: '#faad14'
  },
  PROJECT1_READINESS_REVIEW: {
    key: 'PROJECT1_READINESS_REVIEW',
    label: 'ตรวจสอบความพร้อม',
    description: 'ตรวจสอบบันทึกการพบที่ได้รับอนุมัติ',
    icon: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
    color: '#722ed1'
  },
  PROJECT1_DEFENSE_REQUEST: {
    key: 'PROJECT1_DEFENSE_REQUEST',
    label: 'ยื่นขอสอบโครงงาน',
    description: 'ยื่นเอกสารขอสอบหัวข้อโครงงาน',
    icon: <TrophyOutlined style={{ fontSize: '16px' }} />,
    color: '#eb2f96'
  },
  PROJECT1_DEFENSE_SCHEDULED: {
    key: 'PROJECT1_DEFENSE_SCHEDULED',
    label: 'กำหนดการสอบ',
    description: 'ได้รับกำหนดวันสอบแล้ว',
    icon: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
    color: '#fa8c16'
  },
  PROJECT1_DEFENSE_RESULT: {
    key: 'PROJECT1_DEFENSE_RESULT',
    label: 'ผลการสอบ',
    description: 'ได้รับผลการสอบหัวข้อโครงงาน',
    icon: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
    color: '#52c41a'
  }
};

/**
 * Get step definition by key
 * @param {string} stepKey - Step key (e.g., 'THESIS_PROPOSAL_SUBMITTED')
 * @param {string} workflowType - 'project1' or 'project2'
 * @returns {object} Step definition with label, icon, color, etc.
 */
export const getStepDefinition = (stepKey, workflowType = 'project1') => {
  const definitions = workflowType === 'project2'
    ? PROJECT2_STEP_DEFINITIONS
    : PROJECT1_STEP_DEFINITIONS;

  return definitions[stepKey] || {
    key: stepKey,
    label: stepKey,
    description: '',
    icon: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
    color: '#d9d9d9'
  };
};

/**
 * Get label for step key
 * @param {string} stepKey
 * @param {string} workflowType
 * @returns {string} Thai label
 */
export const getStepLabel = (stepKey, workflowType = 'project1') => {
  const definition = getStepDefinition(stepKey, workflowType);
  return definition.label;
};

/**
 * Get icon for step key
 * @param {string} stepKey
 * @param {string} workflowType
 * @returns {ReactElement} Icon component
 */
export const getStepIcon = (stepKey, workflowType = 'project1') => {
  const definition = getStepDefinition(stepKey, workflowType);
  return definition.icon;
};

/**
 * Get color for step key
 * @param {string} stepKey
 * @param {string} workflowType
 * @returns {string} Hex color
 */
export const getStepColor = (stepKey, workflowType = 'project1') => {
  const definition = getStepDefinition(stepKey, workflowType);
  return definition.color;
};

/**
 * Detect workflow type from step key
 * @param {string} stepKey
 * @returns {string} 'project1' or 'project2'
 */
export const detectWorkflowType = (stepKey) => {
  if (stepKey?.startsWith('THESIS_')) {
    return 'project2';
  }
  if (stepKey?.startsWith('PROJECT1_')) {
    return 'project1';
  }
  // Fallback: check if key exists in either definition
  if (PROJECT2_STEP_DEFINITIONS[stepKey]) {
    return 'project2';
  }
  return 'project1';
};

/**
 * Check if step is a Project 2 (thesis) step
 * @param {string} stepKey
 * @returns {boolean}
 */
export const isThesisStep = (stepKey) => {
  return detectWorkflowType(stepKey) === 'project2';
};

/**
 * Get all steps for a workflow type
 * @param {string} workflowType - 'project1' or 'project2'
 * @returns {Array} Array of step definitions
 */
export const getAllSteps = (workflowType = 'project1') => {
  const definitions = workflowType === 'project2'
    ? PROJECT2_STEP_DEFINITIONS
    : PROJECT1_STEP_DEFINITIONS;

  return Object.values(definitions);
};
