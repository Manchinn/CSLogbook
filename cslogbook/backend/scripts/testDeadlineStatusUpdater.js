/**
 * Test Script: Project Deadline Monitor Agent
 *
 * Manual trigger test for the project deadline monitor agent
 * Tests both deadline_at and end_date transitions + overdue flags
 *
 * Usage: node scripts/testDeadlineStatusUpdater.js
 */

const { sequelize } = require('../config/database');
const projectDeadlineMonitor = require('../agents/projectDeadlineMonitor');
const logger = require('../utils/logger');

async function testAgent() {
  console.log('🧪 Testing Project Deadline Monitor Agent\n');
  console.log('=========================================\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Run the agent manually
    console.log('🚀 Running agent check (manual trigger)...\n');
    await projectDeadlineMonitor.triggerCheck();

    console.log('\n✨ Agent test completed!');
    console.log('\n📝 Check the logs above for:');
    console.log('   - Number of deadlines processed');
    console.log('   - Number of projects transitioned');
    console.log('   - Any errors encountered\n');

    console.log('📊 To see projects in late/overdue states, run:');
    console.log('   SELECT ');
    console.log('     p.project_id, ');
    console.log('     p.title, ');
    console.log('     w.step_key, ');
    console.log('     w.phase_variant ');
    console.log('   FROM workflow_step_definitions w');
    console.log('   JOIN project_workflow_states pws ON w.step_id = pws.workflow_step_id');
    console.log('   JOIN project_documents p ON pws.project_id = p.project_id');
    console.log('   WHERE w.phase_variant IN ("late", "overdue");\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing agent:', error);
    process.exit(1);
  }
}

testAgent();
