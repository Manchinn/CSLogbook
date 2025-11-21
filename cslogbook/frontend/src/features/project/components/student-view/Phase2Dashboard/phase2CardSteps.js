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
  phaseLabel: 'ภาพรวม',
  title: 'โครงงานพิเศษ & ปริญญานิพนธ์ – ภาพรวม',
  desc: 'ติดตามสถานะตั้งแต่โครงงานพิเศษ 1 จนถึงปริญญานิพนธ์ พร้อมไทม์ไลน์สำคัญ',
    icon: <FundProjectionScreenOutlined style={{ fontSize: 28 }} />,
    implemented: true,
    requiresPhase2Unlock: true,
    target: '/project/phase2',
    // ไม่มี deadline (ภาพรวมอย่างเดียว)
    deadlineName: null,
    relatedTo: null
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
    target: '/project/phase2/system-test',
    // 🆕 Deadline mapping
    deadlineName: 'ยื่นคำขอทดสอบระบบ',
    relatedTo: 'project2'
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
    target: '/project/phase2/thesis-defense',
    // 🆕 Deadline mapping
    deadlineName: 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
    relatedTo: 'project2'
  }
]);
