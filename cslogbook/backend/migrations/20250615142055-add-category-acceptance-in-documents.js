'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // ตรวจสอบข้อมูลที่มีอยู่ก่อน
      const [results] = await queryInterface.sequelize.query(`
        SELECT DISTINCT category FROM documents 
        WHERE category NOT IN ('proposal', 'progress', 'final')
      `);

      if (results.length > 0) {
        console.log('Found unexpected category values:', results);
        throw new Error('พบข้อมูล category ที่ไม่คาดคิด กรุณาตรวจสอบข้อมูลก่อน');
      }

      // เพิ่ม ENUM value ใหม่
      await queryInterface.sequelize.query(`
        ALTER TABLE documents 
        MODIFY COLUMN category 
        ENUM('proposal', 'progress', 'final', 'acceptance') 
        NOT NULL
      `);

      console.log('✅ เพิ่ม acceptance category เรียบร้อยแล้ว');

    } catch (error) {
      console.error('❌ Migration ล้มเหลว:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // ตรวจสอบว่ามีข้อมูล acceptance อยู่หรือไม่
      const [results] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM documents WHERE category = 'acceptance'
      `);

      if (results[0].count > 0) {
        console.log(`พบข้อมูล acceptance จำนวน ${results[0].count} รายการ`);
        console.log('กรุณาลบหรือย้ายข้อมูลเหล่านี้ก่อนทำ rollback');
        throw new Error('ไม่สามารถ rollback ได้เนื่องจากมีข้อมูล acceptance อยู่');
      }

      // ลบ ENUM value
      await queryInterface.sequelize.query(`
        ALTER TABLE documents 
        MODIFY COLUMN category 
        ENUM('proposal', 'progress', 'final') 
        NOT NULL
      `);

      console.log('✅ ลบ acceptance category เรียบร้อยแล้ว');

    } catch (error) {
      console.error('❌ Rollback ล้มเหลว:', error.message);
      throw error;
    }
  }
};