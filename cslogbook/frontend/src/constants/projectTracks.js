// projectTracks.js
// ค่าคงที่หมวด (Track) ของโครงงาน + mapping code <-> label
// ใช้ code เป็นค่าที่ส่งไป backend (ENUM) และ label สำหรับแสดงผล

export const TRACK_OPTIONS = [
  { code: 'NETSEC', label: 'Network & Cyber Security' },
  { code: 'WEBMOBILE', label: 'Mobile and Web Technology (Web / Mobile Application)' },
  { code: 'SMART', label: 'Smart Technology' },
  { code: 'AI', label: 'Artificial Intelligence' },
  { code: 'GAMEMEDIA', label: 'Games & Multimedia' }
];

export const CODE_TO_LABEL = TRACK_OPTIONS.reduce((acc, t) => { acc[t.code] = t.label; return acc; }, {});
export const LABEL_TO_CODE = TRACK_OPTIONS.reduce((acc, t) => { acc[t.label] = t.code; return acc; }, {});

// เผื่อ label ย่อในอนาคต (ตอนนี้ยังไม่ใช้)
export const SHORT_LABEL = {
  NETSEC: 'NetSec',
  WEBMOBILE: 'Web/Mobile',
  SMART: 'Smart Tech',
  AI: 'AI',
  GAMEMEDIA: 'Game & Media'
};

export function normalizeIncomingTracks(rawProject) {
  // รับ object project จาก backend (คาดว่า field p.tracks เป็น array ของ code ถ้ารุ่นใหม่)
  // รองรับเคส legacy: p.track เป็น string ของ labels (คั่น ,) หรือ code เดี่ยว
  if (!rawProject) return rawProject;
  const clone = { ...rawProject };
  if (Array.isArray(clone.tracks) && clone.tracks.length) {
    // assumed already code array
    return clone;
  }
  const legacy = clone.track; // อาจเป็น label เดี่ยว หรือ comma labels หรือ code เดี่ยว
  if (legacy) {
    const parts = legacy.split(',').map(s => s.trim()).filter(Boolean);
    const codes = parts.map(p => LABEL_TO_CODE[p] || p).filter(Boolean);
    if (codes.length) clone.tracks = codes;
  }
  return clone;
}
