'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ตรวจสอบว่าตารางมีอยู่หรือไม่
    const tableExists = await queryInterface.showAllTables();
    const hasTable = tableExists.includes('internship_certificate_requests');
    
    if (!hasTable) {
      await queryInterface.createTable('internship_certificate_requests', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'รหัสคำขอหนังสือรับรอง'
        },
        student_id: {
          type: Sequelize.STRING(20),
          allowNull: false,
          comment: 'รหัสนักศึกษา'
        },
        internship_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'รหัสการฝึกงาน'
        },
        document_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'รหัสเอกสาร CS05'
        },
        request_date: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'วันที่ขอหนังสือรับรอง'
        },
        status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected'),
          defaultValue: 'pending',
          allowNull: false,
          comment: 'สถานะคำขอ'
        },
        total_hours: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          comment: 'จำนวนชั่วโมงฝึกงานทั้งหมด'
        },
        evaluation_status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'สถานะการประเมินจากพี่เลี้ยง'
        },
        summary_status: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'สถานะการส่งรายงานสรุปผล'
        },
        requested_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ผู้ขอหนังสือรับรอง (userId)'
        },
        processed_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'วันที่ดำเนินการโดยเจ้าหน้าที่'
        },
        processed_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'เจ้าหน้าที่ที่ดำเนินการ (userId)'
        },
        certificate_number: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'หมายเลขหนังสือรับรอง'
        },
        downloaded_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'วันที่ดาวน์โหลดครั้งแรก'
        },
        download_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: 'จำนวนครั้งที่ดาวน์โหลด'
        },
        remarks: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'หมายเหตุเพิ่มเติม'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'วันที่สร้างข้อมูล'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'วันที่แก้ไขข้อมูลล่าสุด'
        }
      }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        comment: 'ตารางเก็บข้อมูลคำขอหนังสือรับรองการฝึกงาน'
      });
    }

    // ตรวจสอบและสร้าง Indexes
    const indexes = await queryInterface.showIndex('internship_certificate_requests');
    const existingIndexNames = indexes.map(index => index.name);

    // สร้าง Unique Index หากยังไม่มี
    if (!existingIndexNames.includes('unique_student_internship_certificate')) {
      await queryInterface.addIndex('internship_certificate_requests', {
        fields: ['student_id', 'internship_id'],
        unique: true,
        name: 'unique_student_internship_certificate'
      });
    }

    // สร้าง Index สำหรับค้นหาตาม status
    if (!existingIndexNames.includes('idx_certificate_status')) {
      await queryInterface.addIndex('internship_certificate_requests', {
        fields: ['status'],
        name: 'idx_certificate_status'
      });
    }

    // สร้าง Index สำหรับค้นหาตาม request_date
    if (!existingIndexNames.includes('idx_certificate_request_date')) {
      await queryInterface.addIndex('internship_certificate_requests', {
        fields: ['request_date'],
        name: 'idx_certificate_request_date'
      });
    }

    // สร้าง Index สำหรับค้นหาตาม student_id
    if (!existingIndexNames.includes('idx_certificate_student_id')) {
      await queryInterface.addIndex('internship_certificate_requests', {
        fields: ['student_id'],
        name: 'idx_certificate_student_id'
      });
    }

    // ตรวจสอบและสร้าง Foreign Key Constraints
    try {
      // สร้าง Foreign Key Constraint สำหรับ document_id
      await queryInterface.addConstraint('internship_certificate_requests', {
        fields: ['document_id'],
        type: 'foreign key',
        name: 'fk_certificate_document',
        references: {
          table: 'documents',
          field: 'document_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (error) {
      console.log('Foreign key constraint fk_certificate_document already exists or table/field not found');
    }

    try {
      // สร้าง Foreign Key Constraint สำหรับ requested_by
      await queryInterface.addConstraint('internship_certificate_requests', {
        fields: ['requested_by'],
        type: 'foreign key',
        name: 'fk_certificate_requested_by',
        references: {
          table: 'users',
          field: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (error) {
      console.log('Foreign key constraint fk_certificate_requested_by already exists or table/field not found');
    }

    try {
      // สร้าง Foreign Key Constraint สำหรับ processed_by
      await queryInterface.addConstraint('internship_certificate_requests', {
        fields: ['processed_by'],
        type: 'foreign key',
        name: 'fk_certificate_processed_by',
        references: {
          table: 'users',
          field: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      console.log('Foreign key constraint fk_certificate_processed_by already exists or table/field not found');
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // ลบ Foreign Key Constraints ก่อน
      await queryInterface.removeConstraint('internship_certificate_requests', 'fk_certificate_processed_by');
      await queryInterface.removeConstraint('internship_certificate_requests', 'fk_certificate_requested_by');
      await queryInterface.removeConstraint('internship_certificate_requests', 'fk_certificate_document');
    } catch (error) {
      console.log('Some foreign key constraints may not exist');
    }
    
    try {
      // ลบ Indexes
      await queryInterface.removeIndex('internship_certificate_requests', 'idx_certificate_student_id');
      await queryInterface.removeIndex('internship_certificate_requests', 'idx_certificate_request_date');
      await queryInterface.removeIndex('internship_certificate_requests', 'idx_certificate_status');
      await queryInterface.removeIndex('internship_certificate_requests', 'unique_student_internship_certificate');
    } catch (error) {
      console.log('Some indexes may not exist');
    }
    
    // ลบตาราง
    await queryInterface.dropTable('internship_certificate_requests');
  }
};