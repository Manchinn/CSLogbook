'use strict';

/**
 * Migration: เพิ่ม 'cancelled' เข้าไปใน ENUM ของคอลัมน์ status ในตาราง documents
 * 
 * เหตุผล: รองรับการยกเลิกการฝึกงานโดยเจ้าหน้าที่ภาควิชา
 * - rejected = ถูกปฏิเสธโดยอาจารย์/เจ้าหน้าที่เนื่องจากเอกสารไม่ผ่าน
 * - cancelled = ยกเลิกโดยเจ้าหน้าที่ตามคำขอของนักศึกษา (เช่น ขอเปลี่ยนสถานที่ฝึกงาน)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ใช้ raw SQL เพื่อแก้ไข ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE documents 
      MODIFY COLUMN status ENUM(
        'draft', 
        'pending', 
        'approved', 
        'rejected', 
        'supervisor_evaluated',
        'acceptance_approved',
        'referral_ready',
        'referral_downloaded', 
        'completed',
        'cancelled'
      ) DEFAULT 'draft'
    `);
  },

  async down(queryInterface, Sequelize) {
    // ตรวจสอบว่ามีเอกสารที่มีสถานะ 'cancelled' อยู่หรือไม่
    const [results] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM documents WHERE status = 'cancelled'"
    );
    
    const count = results[0].count;
    
    if (count > 0) {
      // ถ้ามีข้อมูลที่ใช้สถานะ cancelled อยู่ ให้เปลี่ยนเป็น rejected ก่อน
      console.log(`Found ${count} documents with 'cancelled' status. Converting to 'rejected'...`);
      await queryInterface.sequelize.query(
        "UPDATE documents SET status = 'rejected' WHERE status = 'cancelled'"
      );
    }
    
    // ลบ 'cancelled' ออกจาก ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE documents 
      MODIFY COLUMN status ENUM(
        'draft', 
        'pending', 
        'approved', 
        'rejected', 
        'supervisor_evaluated',
        'acceptance_approved',
        'referral_ready',
        'referral_downloaded', 
        'completed'
      ) DEFAULT 'draft'
    `);
  }
};
