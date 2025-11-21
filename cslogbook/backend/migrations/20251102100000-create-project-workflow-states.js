/**
 * Migration: สร้างตาราง project_workflow_states
 * เพื่อเป็น Single Source of Truth สำหรับสถานะโครงงานพิเศษ
 * 
 * ปัญหาเดิม: สถานะกระจายอยู่ในหลายตาราง
 * - project_documents.status
 * - project_defense_requests.status
 * - project_exam_results.result
 * - project_test_requests.advisor_status/staff_status
 * 
 * โซลูชัน: ตารางนี้เป็นศูนย์กลางของสถานะ + snapshot ข้อมูลสำคัญ
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // สร้างตาราง project_workflow_states
    await queryInterface.createTable('project_workflow_states', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, // 1 project มี 1 state เท่านั้น
        references: {
          model: 'project_documents',
          key: 'project_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // ========== Current State (Single Source of Truth) ==========
      current_phase: {
        type: Sequelize.ENUM(
          'DRAFT',                    // สร้างโครงงาน ยังไม่เสร็จ
          'PENDING_ADVISOR',          // รอมอบหมายอาจารย์
          'ADVISOR_ASSIGNED',         // มีอาจารย์แล้ว ยังไม่เปิดใช้งาน
          'TOPIC_SUBMISSION',         // ยื่นหัวข้อ (สอบหัวข้อ PROJECT1)
          'TOPIC_EXAM_PENDING',       // รอสอบหัวข้อ
          'TOPIC_EXAM_SCHEDULED',     // กำหนดสอบหัวข้อแล้ว
          'TOPIC_FAILED',             // สอบหัวข้อไม่ผ่าน (ต้องยื่นใหม่)
          'IN_PROGRESS',              // ดำเนินงาน (ผ่านสอบหัวข้อแล้ว)
          'THESIS_SUBMISSION',        // ยื่นสอบปริญญานิพนธ์ (THESIS)
          'THESIS_EXAM_PENDING',      // รอสอบปริญญานิพนธ์
          'THESIS_EXAM_SCHEDULED',    // กำหนดสอบปริญญานิพนธ์แล้ว
          'THESIS_FAILED',            // สอบปริญญานิพนธ์ไม่ผ่าน
          'COMPLETED',                // เสร็จสิ้น (ผ่านทุกอย่าง)
          'ARCHIVED'                  // เก็บถาวร (ผ่านหรือไม่ผ่านแล้ว acknowledge)
        ),
        allowNull: false,
        defaultValue: 'DRAFT'
      },
      
      current_step: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Step ย่อยภายใน phase เช่น topic_submit, defense_submit, document_upload'
      },
      
      // ========== Status Snapshots ==========
      // เก็บสถานะล่าสุดจากตารางอื่น เพื่อไม่ต้อง join ทุกครั้ง
      
      project_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Snapshot of project_documents.status'
      },
      
      topic_exam_result: {
        type: Sequelize.ENUM('PENDING', 'PASS', 'FAIL'),
        allowNull: true,
        comment: 'ผลสอบหัวข้อ (PROJECT1)'
      },
      
      topic_exam_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'วันที่สอบหัวข้อ'
      },
      
      thesis_exam_result: {
        type: Sequelize.ENUM('PENDING', 'PASS', 'FAIL'),
        allowNull: true,
        comment: 'ผลสอบปริญญานิพนธ์ (THESIS)'
      },
      
      thesis_exam_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'วันที่สอบปริญญานิพนธ์'
      },
      
      // ========== Defense Request Tracking ==========
      topic_defense_request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID ของคำขอสอบหัวข้อล่าสุด'
      },
      
      topic_defense_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Snapshot of project_defense_requests.status (PROJECT1)'
      },
      
      thesis_defense_request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID ของคำขอสอบปริญญานิพนธ์ล่าสุด'
      },
      
      thesis_defense_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Snapshot of project_defense_requests.status (THESIS)'
      },
      
      // ========== System Test Tracking ==========
      system_test_request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID ของคำขอทดสอบระบบล่าสุด'
      },
      
      system_test_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'สถานะการทดสอบระบบ: pending, advisor_approved, staff_verified'
      },
      
      // ========== Document Tracking ==========
      final_document_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID ของเอกสารรายงานฉบับสมบูรณ์'
      },
      
      final_document_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Snapshot of documents.status (final report)'
      },
      
      // ========== Progress Tracking ==========
      meeting_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'จำนวนครั้งที่พบอาจารย์'
      },
      
      approved_meeting_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'จำนวนครั้งที่อาจารย์อนุมัติแล้ว'
      },
      
      // ========== Flags ==========
      is_blocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'ถูกบล็อกการทำงาน (เช่น สอบไม่ผ่าน รอแก้ไข)'
      },
      
      block_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'เหตุผลที่ถูกบล็อก'
      },
      
      is_overdue: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'เลยกำหนดเวลา (deadline)'
      },
      
      // ========== Metadata ==========
      last_activity_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'เวลาที่มีการเปลี่ยนแปลงล่าสุด'
      },
      
      last_activity_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'ประเภทของการเปลี่ยนแปลงล่าสุด'
      },
      
      last_updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID ที่อัปเดตสถานะล่าสุด'
      },
      
      // ========== Timestamps ==========
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // สร้าง indexes
    await queryInterface.addIndex('project_workflow_states', ['current_phase']);
    await queryInterface.addIndex('project_workflow_states', ['is_blocked']);
    await queryInterface.addIndex('project_workflow_states', ['is_overdue']);
    await queryInterface.addIndex('project_workflow_states', ['last_activity_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_workflow_states');
  }
};
