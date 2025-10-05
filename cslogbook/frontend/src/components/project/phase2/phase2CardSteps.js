import React from 'react';
import {
  FundProjectionScreenOutlined,
  ExperimentOutlined,
  AuditOutlined
} from '@ant-design/icons';

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
    key: 'thesis-defense-request',
    phase: 'phase2',
    phaseLabel: 'โครงงานพิเศษ 2',
    title: 'ยื่นคำขอสอบ คพ.03',
    desc: 'ส่งคำขอสอบโครงงานพิเศษ 2 พร้อมหลักฐานสำคัญ',
    icon: <AuditOutlined style={{ fontSize: 28 }} />,
    implemented: true,
    requiresPhase2Unlock: true,
    target: '/project/phase2/thesis-defense'
  }
]);
