// สคริปต์ตรวจนักศึกษาที่อยู่มากกว่า 1 โครงงาน (สถานะยังไม่ archived)
// รัน: node scripts/scanActiveProjectDuplicates.js
// หมายเหตุ: ใช้สำหรับการ audit/cleanup ข้อมูลก่อนเปิดใช้ rule ใหม่

const { sequelize } = require('../config/database');

async function main() {
  const q = `
    SELECT pm.student_id, s.student_code, COUNT(DISTINCT pm.project_id) AS active_count,
           GROUP_CONCAT(DISTINCT pd.project_id ORDER BY pd.project_id SEPARATOR ',') AS project_ids
    FROM project_members pm
    JOIN project_documents pd ON pm.project_id = pd.project_id AND pd.status <> 'archived'
    JOIN students s ON pm.student_id = s.student_id
    GROUP BY pm.student_id, s.student_code
    HAVING active_count > 1
    ORDER BY active_count DESC;
  `;
  try {
    const [rows] = await sequelize.query(q);
    if (!rows.length) {
      console.log('ไม่พบนักศึกษาที่อยู่หลายโครงงาน active (ข้อมูลปกติ)');
    } else {
      console.log('พบรายการซ้ำ:');
      rows.forEach(r => {
        console.log(`student_id=${r.student_id} code=${r.student_code} active_count=${r.active_count} projects=${r.project_ids}`);
      });
    }
  } catch (e) {
    console.error('เกิดข้อผิดพลาดในการสแกน', e);
  } finally {
    await sequelize.close();
  }
}

main();
