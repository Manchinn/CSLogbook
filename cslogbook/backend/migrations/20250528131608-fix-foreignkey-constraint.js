'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        
        try {
            // ตรวจสอบและลบ Foreign Key Constraints เก่า
            const [constraints] = await queryInterface.sequelize.query(`
                SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'notification_settings' 
                AND COLUMN_NAME = 'updated_by_admin'
                AND REFERENCED_TABLE_NAME IS NOT NULL
            `, { transaction });

            console.log('พบ Foreign Key Constraints:', constraints);

            // ลบ constraints เก่าทั้งหมด
            for (const constraint of constraints) {
                console.log(`กำลังลบ constraint: ${constraint.CONSTRAINT_NAME}`);
                await queryInterface.removeConstraint('notification_settings', constraint.CONSTRAINT_NAME, { transaction });
            }

            // ตรวจสอบว่าตาราง users มีอยู่จริง
            const [userTable] = await queryInterface.sequelize.query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'users'
            `, { transaction });

            if (userTable.length === 0) {
                throw new Error('ไม่พบตาราง users ในฐานข้อมูล');
            }

            // เพิ่ม Foreign Key Constraint ใหม่ที่อ้างอิงไปยัง users table
            await queryInterface.addConstraint('notification_settings', {
                fields: ['updated_by_admin'],
                type: 'foreign key',
                name: 'fk_notification_settings_updated_by_user',
                references: {
                    table: 'users',
                    field: 'user_id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
                transaction
            });

            console.log('✅ แก้ไข Foreign Key Constraint สำเร็จ');
            await transaction.commit();

        } catch (error) {
            await transaction.rollback();
            console.error('❌ เกิดข้อผิดพลาดในการแก้ไข Foreign Key:', error.message);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        
        try {
            // ลบ constraint ใหม่
            await queryInterface.removeConstraint('notification_settings', 'fk_notification_settings_updated_by_user', { transaction });
            
            console.log('⚠️ Rollback สำเร็จ - ลบ Foreign Key Constraint ใหม่แล้ว');
            await transaction.commit();
            
        } catch (error) {
            await transaction.rollback();
            console.error('❌ เกิดข้อผิดพลาดในการ rollback:', error.message);
            throw error;
        }
    }
};