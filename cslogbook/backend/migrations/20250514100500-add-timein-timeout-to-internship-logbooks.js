'use strict';

/**
 * เพิ่มฟิลด์ time_in/time_out ให้บันทึก logbook และตั้งชื่อไฟล์ตาม timestamp เพื่อให้ Sequelize CLI จัดลำดับได้ถูกต้อง
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('internship_logbooks', 'time_in', {
      type: Sequelize.STRING(5),
      allowNull: true,
      comment: 'เวลาเริ่มปฏิบัติงาน (HH:MM)'
    });

    await queryInterface.addColumn('internship_logbooks', 'time_out', {
      type: Sequelize.STRING(5),
      allowNull: true,
      comment: 'เวลาสิ้นสุดปฏิบัติงาน (HH:MM)'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('internship_logbooks', 'time_in');
    await queryInterface.removeColumn('internship_logbooks', 'time_out');
  }
};
