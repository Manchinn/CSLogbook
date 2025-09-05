'use strict';

/**
 * Seeder สำหรับเพิ่มข้อมูล reflection ให้นักศึกษา ID 32
 * ข้อมูลสรุปและการสะท้อนคิดจากการฝึกงาน
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // =====================================================================================
      // == ข้อมูลสำคัญสำหรับ seeder นี้ ==
      // =====================================================================================
      const studentId = 32; // รหัสนักศึกษา
      const internshipId = 24; // รหัสการฝึกงาน
      // =====================================================================================

      console.log(`[Seeder] เริ่มสร้างข้อมูล Reflection สำหรับนักศึกษา ID ${studentId} (Internship ID: ${internshipId})`);

      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:mm:ss

      // ข้อมูล Reflection ที่จะเพิ่ม
      const reflectionData = {
        internship_id: internshipId,
        student_id: studentId,
        learning_outcome: `จากการฝึกงานในครั้งนี้ ผมได้เรียนรู้และพัฒนาทักษะในหลายด้าน ทั้งด้านเทคนิคและการทำงานเป็นทีม ได้ประสบการณ์การทำงานจริงในสภาพแวดล้อมองค์กร ทำให้เข้าใจถึงกระบวนการพัฒนาซอฟต์แวร์ในภาคอุตสาหกรรม รวมถึงการประยุกต์ใช้ความรู้ทางทฤษฎีที่เรียนมาในการแก้ไขปัญหาจริง การฝึกงานช่วยให้เห็นภาพรวมของการทำงานและเตรียมความพร้อมสำหรับการเข้าสู่ตลาดแรงงานในอนาคต`,
        
        key_learnings: `1. การเขียนโปรแกรมด้วยภาษา JavaScript และ React.js ในโครงการจริง
2. การใช้งาน Git และ GitHub สำหรับการทำงานร่วมกันเป็นทีม
3. การทำงานร่วมกับ Backend API และ Database
4. การทดสอบซอฟต์แวร์และ Debug ปัญหาต่างๆ
5. การจัดการเวลาและการวางแผนงานในโครงการ
6. การสื่อสารและการทำงานเป็นทีมในสภาพแวดล้อมองค์กร
7. การใช้เครื่องมือพัฒนาซอฟต์แวร์สมัยใหม่เช่น VS Code, Postman, MySQL Workbench
8. การเขียนเอกสารและการนำเสนอผลงาน`,
        
        future_application: `ความรู้และประสบการณ์ที่ได้รับจะนำไปประยุกต์ใช้ในการศึกษาต่อและการทำงานในอนาคต โดยเฉพาะ:
1. การพัฒนาโครงการจบการศึกษาด้วยทักษะที่เพิ่มขึ้น
2. การสมัครงานในตำแหน่ง Frontend Developer หรือ Full-stack Developer
3. การทำงานร่วมกับทีมในโครงการต่างๆ ได้อย่างมีประสิทธิภาพ
4. การเรียนรู้เทคโนโลยีใหม่ๆ ได้เร็วขึ้นเนื่องจากมีพื้นฐานที่แข็งแกร่ง
5. การแก้ไขปัญหาเชิงเทคนิคได้อย่างเป็นระบบ
6. การพัฒนาตนเองในด้านการเขียนโปรแกรมอย่างต่อเนื่อง`,
        
        improvements: `ข้อเสนอแนะสำหรับการปรับปรุงในอนาคต:
1. ควรเพิ่มระยะเวลาฝึกงานให้ยาวขึ้นเพื่อให้ได้ประสบการณ์ที่ลึกซึ้งมากขึ้น
2. ควรมีการอบรมเบื้องต้นเกี่ยวกับเครื่องมือและกระบวนการทำงานขององค์กรก่อนเริ่มฝึกงาน
3. ควรมีการติดตามและให้คำแนะนำจากผู้ควบคุมงานอย่างสม่ำเสมอ
4. ควรมีโอกาสได้ทำงานในโครงการที่หลากหลายเพื่อเรียนรู้ในมิติต่างๆ
5. ควรมีการแชร์ความรู้ระหว่างนักศึกษาฝึกงานด้วยกัน
6. ควรเพิ่มการฝึกทักษะ Soft Skills เช่น การนำเสนอ การเจรจาต่อรอง`,
        
        created_at: nowStr,
        updated_at: nowStr
      };

      // สร้างข้อมูล Reflection
      const insertSQL = `
        INSERT INTO internship_logbook_reflections 
        (internship_id, student_id, learning_outcome, key_learnings, future_application, improvements, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await queryInterface.sequelize.query(insertSQL, {
        replacements: [
          reflectionData.internship_id,
          reflectionData.student_id,
          reflectionData.learning_outcome,
          reflectionData.key_learnings,
          reflectionData.future_application,
          reflectionData.improvements,
          reflectionData.created_at,
          reflectionData.updated_at
        ],
        transaction
      });

      console.log(`[Seeder] สร้างข้อมูล Reflection สำหรับนักศึกษา ID ${studentId} สำเร็จ`);

      await transaction.commit();
      console.log(`[Seeder] การสร้างข้อมูล Reflection เสร็จสมบูรณ์`);

    } catch (error) {
      await transaction.rollback();
      console.error(`[Seeder] เกิดข้อผิดพลาดในการสร้างข้อมูล Reflection:`, error);
      if (error.original) {
        console.error(`[Seeder] Original Error:`, error.original);
      }
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentId = 32;
      const internshipId = 24;

      console.log(`[Seeder] เริ่มการลบข้อมูล Reflection สำหรับนักศึกษา ID ${studentId} (Internship ID: ${internshipId})`);

      const deleteQuery = `
        DELETE FROM internship_logbook_reflections
        WHERE student_id = ? AND internship_id = ?
      `;

      const [results, metadata] = await queryInterface.sequelize.query(deleteQuery, {
        replacements: [studentId, internshipId],
        transaction
      });

      console.log(`[Seeder] ลบข้อมูล Reflection สำเร็จ`);

      await transaction.commit();
      console.log(`[Seeder] การลบข้อมูล Reflection เสร็จสมบูรณ์`);
    } catch (error) {
      await transaction.rollback();
      console.error(`[Seeder] เกิดข้อผิดพลาดในการลบข้อมูล Reflection:`, error);
      if (error.original) {
        console.error(`[Seeder] Original Error:`, error.original);
      }
      throw error;
    }
  }
};