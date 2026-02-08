export type ProjectStep = {
  key: string;
  title: string;
  desc: string;
  target: string;
  deadlineName?: string | null;
  relatedTo?: string | null;
};

export const phase2Steps: ProjectStep[] = [
  {
    key: "system-test",
    title: "ขอทดสอบระบบ 30 วัน",
    desc: "ส่งคำขอให้อาจารย์และเจ้าหน้าที่อนุมัติ พร้อมหลักฐาน",
    target: "/project/phase2/system-test",
    deadlineName: "ยื่นคำขอทดสอบระบบ",
    relatedTo: "project2",
  },
  {
    key: "thesis-defense",
    title: "ยื่นคำขอสอบ คพ.03",
    desc: "ส่งคำขอสอบโครงงานพิเศษ 2 พร้อมข้อมูลครบถ้วน",
    target: "/project/phase2/thesis-defense",
    deadlineName: "ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)",
    relatedTo: "project2",
  },
];
