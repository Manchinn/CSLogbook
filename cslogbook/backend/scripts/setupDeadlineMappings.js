/**
 * Script: สร้างความสัมพันธ์ระหว่าง important_deadlines และเอกสาร
 * ใช้เมื่อ: มี deadline และเอกสารแล้ว แต่ยังไม่ได้เชื่อมโยง
 * 
 * วิธีใช้:
 * 1. แก้ไข DEADLINE_MAPPINGS ให้ตรงกับข้อมูลจริง
 * 2. รัน: node backend/scripts/setupDeadlineMappings.js
 */

require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const { DeadlineWorkflowMapping, ImportantDeadline, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * กำหนด Mappings ระหว่าง deadline กับประเภทเอกสาร
 * 
 * ⚠️ IMPORTANT: ต้องสร้าง deadline ใน important_deadlines ก่อน
 * แล้วเอา ID มาใส่ที่นี่
 */
const DEADLINE_MAPPINGS = [
    // ========== ตัวอย่าง: Internship Workflow ==========
    // {
    //     deadlineName: 'ส่งเอกสาร คพ.01 - คำร้องขอฝึกงาน',
    //     workflowType: 'internship',
    //     documentSubtype: 'KP01',
    //     autoAssign: 'on_submit',
    //     // หรือกำหนด important_deadline_id โดยตรง
    //     // importantDeadlineId: 10
    // },
    // {
    //     deadlineName: 'ส่งเอกสาร คพ.02 - หนังสือตอบรับฝึกงาน',
    //     workflowType: 'internship',
    //     documentSubtype: 'KP02',
    //     autoAssign: 'on_submit'
    // },
    // {
    //     deadlineName: 'ส่งเอกสาร คพ.05 - รายงานผลการฝึกงาน',
    //     workflowType: 'internship',
    //     documentSubtype: 'KP05',
    //     autoAssign: 'on_submit'
    // },
    
    // ========== ตัวอย่าง: Project Workflow ==========
    // {
    //     deadlineName: 'ส่งเค้าโครงโครงงาน (Proposal)',
    //     workflowType: 'project1',
    //     documentSubtype: 'PROJECT_PROPOSAL',
    //     autoAssign: 'on_submit'
    // },
    // {
    //     deadlineName: 'ส่งรายงานความก้าวหน้า (Progress)',
    //     workflowType: 'project1',
    //     documentSubtype: 'PROJECT_PROGRESS',
    //     autoAssign: 'on_submit'
    // },
    // {
    //     deadlineName: 'ส่งรายงานฉบับสมบูรณ์ (Final)',
    //     workflowType: 'project1',
    //     documentSubtype: 'PROJECT_FINAL',
    //     autoAssign: 'on_submit'
    // }
];

/**
 * ค้นหา deadline ID จากชื่อ
 */
async function findDeadlineByName(name, academicYear, semester) {
    const deadline = await ImportantDeadline.findOne({
        where: { 
            name,
            academicYear: academicYear || '2567',
            semester: semester || 1
        }
    });
    return deadline?.id;
}

/**
 * สร้าง mapping records
 */
async function setupMappings() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('🚀 เริ่มสร้าง Deadline-Document Mappings...\n');
        
        if (DEADLINE_MAPPINGS.length === 0) {
            console.log('⚠️  ไม่พบ DEADLINE_MAPPINGS');
            console.log('📝 กรุณาแก้ไขไฟล์นี้และเพิ่ม mappings ที่ต้องการ\n');
            console.log('ตัวอย่าง:');
            console.log(`{
    deadlineName: 'ส่งเอกสาร คพ.05 - รายงานผลการฝึกงาน',
    workflowType: 'internship',
    documentSubtype: 'KP05',
    autoAssign: 'on_submit'
}`);
            return;
        }

        const created = [];
        const skipped = [];
        const errors = [];

        for (const mapping of DEADLINE_MAPPINGS) {
            try {
                let deadlineId = mapping.importantDeadlineId;
                
                // ถ้าไม่มี ID ให้ค้นหาจากชื่อ
                if (!deadlineId && mapping.deadlineName) {
                    deadlineId = await findDeadlineByName(
                        mapping.deadlineName,
                        mapping.academicYear,
                        mapping.semester
                    );
                }

                if (!deadlineId) {
                    errors.push({
                        mapping,
                        error: 'ไม่พบ deadline ID หรือไม่พบ deadline จากชื่อ'
                    });
                    continue;
                }

                // ตรวจสอบว่ามี mapping อยู่แล้วหรือไม่
                const existing = await DeadlineWorkflowMapping.findOne({
                    where: {
                        workflowType: mapping.workflowType,
                        documentSubtype: mapping.documentSubtype
                    },
                    transaction
                });

                if (existing) {
                    skipped.push({
                        workflowType: mapping.workflowType,
                        documentSubtype: mapping.documentSubtype,
                        reason: 'มี mapping อยู่แล้ว'
                    });
                    continue;
                }

                // สร้าง mapping ใหม่
                const newMapping = await DeadlineWorkflowMapping.create({
                    importantDeadlineId: deadlineId,
                    workflowType: mapping.workflowType,
                    stepKey: mapping.stepKey || null,
                    documentSubtype: mapping.documentSubtype,
                    autoAssign: mapping.autoAssign || 'on_submit',
                    active: mapping.active !== undefined ? mapping.active : true
                }, { transaction });

                created.push({
                    id: newMapping.id,
                    deadlineId,
                    workflowType: mapping.workflowType,
                    documentSubtype: mapping.documentSubtype
                });

            } catch (err) {
                errors.push({
                    mapping,
                    error: err.message
                });
            }
        }

        await transaction.commit();

        // แสดงสรุปผล
        console.log('✅ สร้าง Mappings เรียบร้อย:', created.length);
        if (created.length > 0) {
            console.table(created);
        }

        if (skipped.length > 0) {
            console.log('\n⏭️  ข้าม (มีอยู่แล้ว):', skipped.length);
            console.table(skipped);
        }

        if (errors.length > 0) {
            console.log('\n❌ ข้อผิดพลาด:', errors.length);
            errors.forEach(e => {
                console.error(`- ${e.mapping.documentSubtype}:`, e.error);
            });
        }

        console.log('\n✨ เสร็จสิ้น!');

    } catch (error) {
        await transaction.rollback();
        console.error('❌ เกิดข้อผิดพลาด:', error);
        throw error;
    }
}

/**
 * แสดงรายการ deadline ที่มีอยู่ในระบบ
 */
async function listAvailableDeadlines() {
    console.log('\n📋 รายการ Deadlines ที่มีในระบบ:\n');
    
    const deadlines = await ImportantDeadline.findAll({
        attributes: ['id', 'name', 'relatedTo', 'academicYear', 'semester', 'deadlineType'],
        order: [['academicYear', 'DESC'], ['semester', 'DESC'], ['id', 'DESC']]
    });

    if (deadlines.length === 0) {
        console.log('⚠️  ไม่พบ deadline ในระบบ');
        console.log('💡 ต้องสร้าง deadline ก่อนที่ URL: /admin/settings/academic (แท็บกำหนดการ)');
        return;
    }

    console.table(deadlines.map(d => ({
        ID: d.id,
        'ชื่อ': d.name,
        'ประเภท': d.relatedTo,
        'ปีการศึกษา': d.academicYear,
        'เทอม': d.semester,
        'Type': d.deadlineType
    })));

    console.log('\n💡 แนะนำการใช้งาน:');
    console.log('1. เลือก ID ของ deadline ที่ต้องการ');
    console.log('2. แก้ไข DEADLINE_MAPPINGS ในไฟล์นี้');
    console.log('3. รันสคริปต์อีกครั้ง\n');
}

/**
 * แสดงรายการ mappings ที่มีอยู่
 */
async function listExistingMappings() {
    console.log('\n🔗 รายการ Mappings ที่มีอยู่:\n');
    
    const mappings = await DeadlineWorkflowMapping.findAll({
        include: [{
            model: ImportantDeadline,
            as: 'deadline',
            attributes: ['id', 'name']
        }]
    });

    if (mappings.length === 0) {
        console.log('⚠️  ยังไม่มี mapping ในระบบ');
        return;
    }

    console.table(mappings.map(m => ({
        ID: m.id,
        'Deadline': m.deadline?.name || `ID:${m.importantDeadlineId}`,
        'Workflow': m.workflowType,
        'Document Type': m.documentSubtype,
        'Auto Assign': m.autoAssign,
        'Active': m.active ? '✓' : '✗'
    })));
}

// Main execution
async function main() {
    try {
        const command = process.argv[2];

        if (command === 'list-deadlines') {
            await listAvailableDeadlines();
        } else if (command === 'list-mappings') {
            await listExistingMappings();
        } else if (command === 'setup') {
            await setupMappings();
        } else {
            console.log('📚 Deadline Mapping Setup Tool\n');
            console.log('คำสั่ง:');
            console.log('  node backend/scripts/setupDeadlineMappings.js list-deadlines  # ดูรายการ deadline');
            console.log('  node backend/scripts/setupDeadlineMappings.js list-mappings   # ดูรายการ mapping ที่มี');
            console.log('  node backend/scripts/setupDeadlineMappings.js setup           # สร้าง mappings ใหม่');
            console.log('');
        }

        await sequelize.close();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
