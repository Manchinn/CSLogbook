const { sequelize, ProjectDocument, ProjectDefenseRequest, Student } = require('../models');
const { Op } = require('sequelize');

async function createLateRequest() {
  try {
    console.log('--- STARTING TEST DATA CREATION ---');
    
    // 1. Find projects that already have requests
    const existingRequests = await ProjectDefenseRequest.findAll({
        attributes: ['projectId'],
        where: { defenseType: 'PROJECT1' }
    });
    const usedProjectIds = existingRequests.map(r => r.projectId);

    // 2. Find a project NOT in that list
    const project = await ProjectDocument.findOne({
        where: {
            projectId: { [Op.notIn]: usedProjectIds }
        }
    });

    if (!project) {
        console.error('❌ No available project found (all have requests).');
        return;
    }

    const student = await Student.findOne(); // Just pick any student for now
    
    console.log(`Using Project ID: ${project.projectId} (New Request)`);
    console.log(`Using Student ID: ${student.studentId}`);

    // 3. Create Late Request
    const request = await ProjectDefenseRequest.create({
      projectId: project.projectId,
      defenseType: 'PROJECT1',
      status: 'advisor_approved',
      formPayload: { note: 'TEST LATE SUBMISSION' },
      submittedByStudentId: student.studentId,
      submittedAt: new Date(),
      advisorApprovedAt: new Date(),
      submittedLate: true,
      submissionDelayMinutes: 180
    });

    console.log(`\n✅ CREATED Request ID: ${request.requestId}`);
    console.log(`   Submitted Late: ${request.submittedLate}`);
    console.log(`   Delay Minutes: ${request.submissionDelayMinutes}`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await sequelize.close();
  }
}

createLateRequest();
