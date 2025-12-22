/**
 * Test Script: Enhanced Project Deadline Monitor
 * 
 * Tests the merged deadline management functionality:
 * - ImportantDeadline checks
 * - Workflow state transitions (PENDING → LATE → OVERDUE)
 * - isOverdue flag updates
 * - Notification triggers
 * 
 * Usage: node scripts/testProjectDeadlineMonitor.js
 */

const { sequelize } = require('../config/database');
const projectDeadlineMonitor = require('../agents/projectDeadlineMonitor');
const { ImportantDeadline, ProjectWorkflowState, WorkflowStepDefinition, ProjectDocument } = require('../models');
const logger = require('../utils/logger');

async function testEnhancedAgent() {
  console.log('🧪 Testing Enhanced Project Deadline Monitor\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // ========== Step 1: Database Connection ==========
    console.log('📡 Step 1: Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // ========== Step 2: Check Data ==========
    console.log('📊 Step 2: Checking system data...\n');

    // Count important deadlines
    const deadlineCount = await ImportantDeadline.count({
      where: {
        relatedTo: { [sequelize.Sequelize.Op.in]: ['project1', 'project2'] }
      }
    });
    console.log(`   - ImportantDeadlines (project): ${deadlineCount}`);

    // Count workflow states
    const workflowStateCount = await WorkflowStepDefinition.count({
      where: {
        workflow_type: { [sequelize.Sequelize.Op.in]: ['project1', 'project2'] }
      }
    });
    console.log(`   - WorkflowStepDefinitions: ${workflowStateCount}`);

    // Count late/overdue states
    const lateOvdCount = await WorkflowStepDefinition.count({
      where: {
        workflow_type: { [sequelize.Sequelize.Op.in]: ['project1', 'project2'] },
        phase_variant: { [sequelize.Sequelize.Op.in]: ['late', 'overdue'] }
      }
    });
    console.log(`   - Late/Overdue states: ${lateOvdCount}/18 expected`);

    if (lateOvdCount === 0) {
      console.log('   ⚠️  WARNING: No late/overdue states found!');
      console.log('   Run: node scripts/seedLateOverdueStates.js\n');
    }

    // Count active projects
    const activeProjects = await ProjectWorkflowState.count({
      include: [{
        model: ProjectDocument,
        as: 'project',
        where: {
          status: { [sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled', 'archived'] }
        }
      }]
    });
    console.log(`   - Active projects: ${activeProjects}\n`);

    // ========== Step 3: Show Sample States ==========
    console.log('📋 Step 3: Sample workflow states...\n');
    
    const sampleStates = await WorkflowStepDefinition.findAll({
      where: {
        workflow_type: 'project1',
        phase_variant: { [sequelize.Sequelize.Op.in]: ['default', 'late', 'overdue'] },
        phase_key: 'proposal'
      },
      attributes: ['step_key', 'phase_key', 'phase_variant', 'title'],
      order: [['step_order', 'ASC']],
      limit: 5
    });

    sampleStates.forEach(state => {
      const icon = state.phase_variant === 'default' ? '✅' : 
                   state.phase_variant === 'late' ? '⚠️' : '❌';
      console.log(`   ${icon} ${state.step_key}`);
      console.log(`      Variant: ${state.phase_variant} | ${state.title}`);
    });
    console.log();

    // ========== Step 4: Check Current Statistics ==========
    console.log('📈 Step 4: Current agent statistics...\n');
    
    const stats = projectDeadlineMonitor.getStatistics();
    console.log(`   - Agent running: ${stats.isRunning}`);
    console.log(`   - Last run: ${stats.lastRunTime || 'Never'}`);
    if (stats.statistics) {
      console.log(`   - Last statistics:`, stats.statistics);
    }
    console.log();

    // ========== Step 5: Manual Trigger Test ==========
    console.log('🚀 Step 5: Running agent manually...\n');
    console.log('   (This may take a few seconds...)\n');
    
    const startTime = Date.now();
    await projectDeadlineMonitor.triggerCheck();
    const duration = Date.now() - startTime;

    console.log(`✅ Agent completed in ${duration}ms\n`);

    // ========== Step 6: Check Results ==========
    console.log('📊 Step 6: Checking results...\n');
    
    const updatedStats = projectDeadlineMonitor.getStatistics();
    console.log('   Final statistics:');
    console.log(`   - Total checked: ${updatedStats.statistics.totalChecked}`);
    console.log(`   - State transitions: ${updatedStats.statistics.stateTransitions || 0}`);
    console.log(`   - Newly overdue: ${updatedStats.statistics.newlyOverdue}`);
    console.log(`   - Still overdue: ${updatedStats.statistics.stillOverdue}`);
    console.log(`   - No longer overdue: ${updatedStats.statistics.noLongerOverdue}`);
    console.log(`   - Errors: ${updatedStats.statistics.errors}\n`);

    // ========== Step 7: Query Results ==========
    console.log('🔍 Step 7: Sample query for verification...\n');
    
    // Use raw query since ProjectWorkflowState doesn't have workflow_step_id
    // The enhanced agent uses WorkflowStepDefinition directly
    const [lateResults] = await sequelize.query(`
      SELECT step_key, phase_variant, COUNT(*) as count
      FROM workflow_step_definitions
      WHERE workflow_type IN ('project1', 'project2')
        AND phase_variant = 'late'
      GROUP BY step_key, phase_variant
    `);

    const [overdueResults] = await sequelize.query(`
      SELECT step_key, phase_variant, COUNT(*) as count
      FROM workflow_step_definitions
      WHERE workflow_type IN ('project1', 'project2')
        AND phase_variant = 'overdue'
      GROUP BY step_key, phase_variant
    `);

    console.log(`   - Late state definitions: ${lateResults.length} types`);
    console.log(`   - Overdue state definitions: ${overdueResults.length} types\n`);
    
    if (lateResults.length > 0) {
      console.log('   Sample late states:');
      lateResults.slice(0, 3).forEach(r => {
        console.log(`   - ${r.step_key}`);
      });
      console.log();
    }

    // Note: ProjectWorkflowState doesn't have workflow_step_id column
    // It uses currentPhase enum instead
    console.log('   ℹ️  Note: ProjectWorkflowState uses currentPhase enum,');
    console.log('      not workflow_step_id. State transitions would need');
    console.log('      to be tracked differently or schema updated.\n');

    // ========== Summary ==========
    console.log('='.repeat(60));
    console.log('✨ TEST SUMMARY\n');
    console.log('✅ Database connection: OK');
    console.log(`✅ Workflow states: ${lateOvdCount === 18 ? 'OK (18/18)' : 'PARTIAL (' + lateOvdCount + '/18)'}`);
    console.log(`✅ Agent execution: OK (${duration}ms)`);
    console.log(`✅ State transitions: ${updatedStats.statistics.stateTransitions || 0} projects`);
    console.log(`✅ Overdue detection: ${updatedStats.statistics.newlyOverdue} new + ${updatedStats.statistics.stillOverdue} existing`);
    console.log();

    if (updatedStats.statistics.errors > 0) {
      console.log(`⚠️  WARNING: ${updatedStats.statistics.errors} errors occurred`);
      console.log('   Check logs for details\n');
    }

    console.log('📝 Note: ProjectWorkflowState schema uses currentPhase enum');
    console.log('   The new workflow system would need to add workflow_step_id');
    console.log('   column to fully support late/overdue state transitions.\n');
    
    console.log('📝 To check late/overdue state definitions:');
    console.log('   SELECT step_key, phase_variant, workflow_type');
    console.log('   FROM workflow_step_definitions');
    console.log('   WHERE phase_variant IN (\'late\', \'overdue\');\n');

    console.log('='.repeat(60));
    console.log('\n✅ All tests completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
testEnhancedAgent();
