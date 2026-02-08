export type ProjectStep = {
  key: string;
  phase: "phase1" | "phase2";
  phaseLabel?: string | null;
  title: string;
  desc: string;
  icon: string;
  implemented: boolean;
  comingSoon?: boolean;
  requiresPostTopicUnlock?: boolean;
  requiresPhase2Unlock?: boolean;
  target?: string | null;
  deadlineName?: string | null;
  relatedTo?: string | null;
};

export const phase1Steps: ProjectStep[] = [
  {
    key: "topic-submit",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "เสนอหัวข้อโครงงานพิเศษ",
    desc: "ส่งหัวข้อและข้อมูลโครงงานเพื่อเข้าสู่ขั้นตอนถัดไป",
    icon: "KP01",
    implemented: true,
    target: "/project/phase1/topic-submit",
    deadlineName: "ส่งหัวข้อโครงงานพิเศษ 1",
    relatedTo: "project1",
  },
  {
    key: "topic-exam",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "ติดตามผลสอบหัวข้อ",
    desc: "ดูตารางสอบและสถานะผลสอบหัวข้อ",
    icon: "EXM",
    implemented: true,
    target: "/project/phase1/topic-exam",
  },
  {
    key: "proposal-revision",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "อัปโหลด Proposal ฉบับแก้ไข",
    desc: "ส่งเอกสาร Proposal ตามข้อเสนอแนะ",
    icon: "REV",
    implemented: true,
    requiresPostTopicUnlock: true,
    target: "/project/phase1/proposal-revision",
  },
  {
    key: "meeting-logbook",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "บันทึกการพบอาจารย์",
    desc: "จองและบันทึกการประชุม พร้อมส่งอีเมลแจ้งเตือน",
    icon: "LOG",
    implemented: true,
    requiresPostTopicUnlock: true,
    target: "/project/phase1/meeting-logbook",
  },
  {
    key: "exam-submit",
    phase: "phase1",
    phaseLabel: "โครงงานพิเศษ 1",
    title: "ส่งเอกสารสอบ",
    desc: "ส่งคำขอสอบ คพ.02 และเอกสารประกอบการสอบ",
    icon: "KP02",
    implemented: true,
    requiresPostTopicUnlock: true,
    target: "/project/phase1/exam-submit",
    deadlineName: "ส่งคำร้องขอสอบ (คพ.02)",
    relatedTo: "project1",
  },
];

export const phase2Steps: ProjectStep[] = [
  {
    key: "phase2-overview",
    phase: "phase2",
    phaseLabel: "ภาพรวม",
    title: "โครงงานพิเศษ & ปริญญานิพนธ์ – ภาพรวม",
    desc: "ติดตามสถานะและไทม์ไลน์โครงงานพิเศษ 2",
    icon: "OVR",
    implemented: true,
    requiresPhase2Unlock: true,
    target: "/project/phase2",
  },
  {
    key: "system-test",
    phase: "phase2",
    phaseLabel: "โครงงานพิเศษ 2",
    title: "ขอทดสอบระบบ 30 วัน",
    desc: "ส่งคำขอทดสอบระบบและติดตามสถานะอนุมัติ",
    icon: "TEST",
    implemented: true,
    requiresPhase2Unlock: true,
    target: "/project/phase2/system-test",
    deadlineName: "ยื่นคำขอทดสอบระบบ",
    relatedTo: "project2",
  },
  {
    key: "thesis-defense-request",
    phase: "phase2",
    phaseLabel: "โครงงานพิเศษ 2",
    title: "ยื่นคำขอสอบ คพ.03",
    desc: "ส่งคำขอสอบโครงงานพิเศษ 2 พร้อมหลักฐานสำคัญ",
    icon: "KP03",
    implemented: true,
    requiresPhase2Unlock: true,
    target: "/project/phase2/thesis-defense",
    deadlineName: "ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)",
    relatedTo: "project2",
  },
];
