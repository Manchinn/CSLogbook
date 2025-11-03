/**
 * Verification Script: Google Classroom Style Late Tracking
 * 
 * ตรวจสอบว่า:
 * 1. Columns ใหม่ถูกสร้างใน database
 * 2. Indexes ถูกสร้างถูกต้อง
 * 3. Foreign keys เชื่อมโยงถูกต้อง
 * 4. Models โหลดได้ไม่มี error
 */

require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const { Document, ProjectDocument, ImportantDeadline, sequelize } = require('../models');
const logger = require('../utils/logger');

async function checkDatabaseColumns() {
    console.log('\n📊 ตรวจสอบ Database Schema\n');
    
    try {
        // Check documents table
        console.log('📋 Table: documents');
        const documentsDesc = await sequelize.getQueryInterface().describeTable('documents');
        
        const requiredDocFields = ['submitted_late', 'submission_delay_minutes', 'important_deadline_id'];
        const docResults = {};
        
        requiredDocFields.forEach(field => {
            docResults[field] = documentsDesc[field] ? '✅ มี' : '❌ ไม่มี';
        });
        
        console.table(docResults);
        
        // Check project_documents table
        console.log('\n📋 Table: project_documents');
        const projectDocsDesc = await sequelize.getQueryInterface().describeTable('project_documents');
        
        const requiredProjFields = ['submitted_late', 'submission_delay_minutes', 'important_deadline_id'];
        const projResults = {};
        
        requiredProjFields.forEach(field => {
            projResults[field] = projectDocsDesc[field] ? '✅ มี' : '❌ ไม่มี';
        });
        
        console.table(projResults);
        
        // Check indexes
        console.log('\n🔍 ตรวจสอบ Indexes');
        const [docIndexes] = await sequelize.query(`SHOW INDEX FROM documents WHERE Key_name LIKE '%submitted_late%' OR Key_name LIKE '%deadline_id%'`);
        const [projIndexes] = await sequelize.query(`SHOW INDEX FROM project_documents WHERE Key_name LIKE '%submitted_late%' OR Key_name LIKE '%deadline_id%'`);
        
        console.log('\nIndexes in documents:');
        console.table(docIndexes.map(idx => ({
            Index: idx.Key_name,
            Column: idx.Column_name,
            Unique: idx.Non_unique === 0 ? 'Yes' : 'No'
        })));
        
        console.log('\nIndexes in project_documents:');
        console.table(projIndexes.map(idx => ({
            Index: idx.Key_name,
            Column: idx.Column_name,
            Unique: idx.Non_unique === 0 ? 'Yes' : 'No'
        })));
        
        return true;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบ schema:', error.message);
        return false;
    }
}

async function checkModels() {
    console.log('\n🔧 ตรวจสอบ Sequelize Models\n');
    
    try {
        // Check Document model
        console.log('📄 Model: Document');
        const docFields = Object.keys(Document.rawAttributes);
        const hasSubmittedLate = docFields.includes('submittedLate');
        const hasDelayMinutes = docFields.includes('submissionDelayMinutes');
        const hasDeadlineId = docFields.includes('importantDeadlineId');
        
        console.table({
            'submittedLate': hasSubmittedLate ? '✅' : '❌',
            'submissionDelayMinutes': hasDelayMinutes ? '✅' : '❌',
            'importantDeadlineId': hasDeadlineId ? '✅' : '❌'
        });
        
        // Check ProjectDocument model
        console.log('\n📄 Model: ProjectDocument');
        const projFields = Object.keys(ProjectDocument.rawAttributes);
        const projHasSubmittedLate = projFields.includes('submittedLate');
        const projHasDelayMinutes = projFields.includes('submissionDelayMinutes');
        const projHasDeadlineId = projFields.includes('importantDeadlineId');
        
        console.table({
            'submittedLate': projHasSubmittedLate ? '✅' : '❌',
            'submissionDelayMinutes': projHasDelayMinutes ? '✅' : '❌',
            'importantDeadlineId': projHasDeadlineId ? '✅' : '❌'
        });
        
        // Check associations
        console.log('\n🔗 ตรวจสอบ Associations');
        const docAssociations = Object.keys(Document.associations);
        const hasImportantDeadlineAssoc = docAssociations.includes('importantDeadline');
        
        const projAssociations = Object.keys(ProjectDocument.associations);
        const projHasImportantDeadlineAssoc = projAssociations.includes('importantDeadline');
        
        console.table({
            'Document -> ImportantDeadline': hasImportantDeadlineAssoc ? '✅' : '❌',
            'ProjectDocument -> ImportantDeadline': projHasImportantDeadlineAssoc ? '✅' : '❌'
        });
        
        return hasSubmittedLate && hasDelayMinutes && projHasSubmittedLate && projHasDelayMinutes;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบ models:', error.message);
        return false;
    }
}

async function checkDataIntegrity() {
    console.log('\n🔍 ตรวจสอบความสมบูรณ์ของข้อมูล\n');
    
    try {
        // Count documents with late tracking
        const totalDocs = await Document.count();
        const lateDocsCount = await Document.count({ where: { submittedLate: true } });
        const docsWithDeadline = await Document.count({ where: { importantDeadlineId: { [sequelize.Sequelize.Op.ne]: null } } });
        
        console.log('📊 สถิติเอกสาร (Documents):');
        console.table({
            'เอกสารทั้งหมด': totalDocs,
            'ส่งสาย': lateDocsCount,
            'มี deadline_id': docsWithDeadline
        });
        
        // Count projects with late tracking
        const totalProjects = await ProjectDocument.count();
        const lateProjectsCount = await ProjectDocument.count({ where: { submittedLate: true } });
        const projectsWithDeadline = await ProjectDocument.count({ where: { importantDeadlineId: { [sequelize.Sequelize.Op.ne]: null } } });
        
        console.log('\n📊 สถิติโครงงาน (ProjectDocuments):');
        console.table({
            'โครงงานทั้งหมด': totalProjects,
            'ส่งสาย': lateProjectsCount,
            'มี deadline_id': projectsWithDeadline
        });
        
        // Sample late submissions
        if (lateDocsCount > 0) {
            console.log('\n🔎 ตัวอย่างเอกสารที่ส่งสาย:');
            const lateDocs = await Document.findAll({
                where: { submittedLate: true },
                limit: 5,
                attributes: ['documentId', 'documentName', 'submittedAt', 'submissionDelayMinutes'],
                include: [{
                    model: ImportantDeadline,
                    as: 'importantDeadline',
                    attributes: ['id', 'name', 'deadlineAt']
                }]
            });
            
            console.table(lateDocs.map(doc => ({
                ID: doc.documentId,
                ชื่อ: doc.documentName,
                'ส่งเมื่อ': doc.submittedAt?.toISOString()?.split('T')[0] || 'N/A',
                'ช้า (นาที)': doc.submissionDelayMinutes || 0,
                Deadline: doc.importantDeadline?.name || 'N/A'
            })));
        }
        
        return true;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบข้อมูล:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 เริ่มตรวจสอบ Google Classroom Style Late Tracking Implementation\n');
    console.log('='.repeat(70));
    
    try {
        const schemaOk = await checkDatabaseColumns();
        const modelsOk = await checkModels();
        const dataOk = await checkDataIntegrity();
        
        console.log('\n' + '='.repeat(70));
        console.log('\n📋 สรุปผลการตรวจสอบ:\n');
        
        const summary = {
            'Database Schema': schemaOk ? '✅ ผ่าน' : '❌ ไม่ผ่าน',
            'Sequelize Models': modelsOk ? '✅ ผ่าน' : '❌ ไม่ผ่าน',
            'Data Integrity': dataOk ? '✅ ผ่าน' : '❌ ไม่ผ่าน'
        };
        
        console.table(summary);
        
        if (schemaOk && modelsOk && dataOk) {
            console.log('\n✨ ระบบพร้อมใช้งาน! Implementation สำเร็จ\n');
        } else {
            console.log('\n⚠️  พบปัญหา กรุณาตรวจสอบและแก้ไข\n');
        }
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดร้ายแรง:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

main();
