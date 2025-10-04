import React from 'react';
import {
  CalendarOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

export { default as Phase2Dashboard } from './Phase2Dashboard';

export const phase2CardSteps = Object.freeze([
  {
    key: 'phase2-overview',
    phase: 'phase2',
  phaseLabel: 'โครงงานพิเศษ 2',
    title: 'โครงงานพิเศษ 2 – ภาพรวม',
    desc: 'ติดตามสถานะ ผลสอบ และไทม์ไลน์หลังผ่านโครงงานพิเศษ 1',
    icon: <FundProjectionScreenOutlined style={{ fontSize: 28 }} />,
    implemented: true,
    requiresPhase2Unlock: true,
    target: '/project/phase2'
  },
  {
    key: 'system-test',
    phase: 'phase2',
  phaseLabel: 'โครงงานพิเศษ 2',
    title: 'ขอทดสอบระบบ 30 วัน',
    desc: 'ส่งคำขอให้อาจารย์และเจ้าหน้าที่อนุมัติ พร้อมหลักฐานเมื่อครบกำหนด',
    icon: <ExperimentOutlined style={{ fontSize: 28 }} />,
    implemented: true,
    requiresPhase2Unlock: true,
    target: '/project/phase2/system-test'
  },
  {
    key: 'phase2-progress-report',
    phase: 'phase2',
  phaseLabel: 'โครงงานพิเศษ 2',
    title: 'เตรียมรายงานความก้าวหน้า',
    desc: 'รวบรวม Progress Report และหลักฐานประกอบการยื่นสอบ คพ.03',
    icon: <FileTextOutlined style={{ fontSize: 28 }} />,
    implemented: false,
    requiresPhase2Unlock: true,
    comingSoon: true
  },
  {
    key: 'phase2-defense-schedule',
    phase: 'phase2',
  phaseLabel: 'โครงงานพิเศษ 2',
    title: 'ติดตามกำหนดการสอบโครงงานพิเศษ 2',
    desc: 'ตรวจสอบวัน เวลา และสถานที่สอบจากเจ้าหน้าที่ภาควิชา',
    icon: <CalendarOutlined style={{ fontSize: 28 }} />,
    implemented: false,
    requiresPhase2Unlock: true,
    comingSoon: true
  }
]);
