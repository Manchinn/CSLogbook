/**
 * Script to run migration: Add workflow_step_id column
 * 
 * Usage: node scripts/runWorkflowStepMigration.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Running migration: Add workflow_step_id to project_workflow_states\n');
console.log('='.repeat(60) + '\n');

try {
  // Run the migration
  console.log('📝 Executing migration...\n');
  
  const migrationFile = '20251122000002-add-workflow-step-id-to-project-workflow-states.js';
  
  // Run with npx sequelize-cli
  execSync(`npx sequelize-cli db:migrate --migrations-path migrations --to ${migrationFile}`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Migration completed successfully!\n');
  
  console.log('📊 What was changed:');
  console.log('   - Added workflow_step_id column to project_workflow_states');
  console.log('   - Added foreign key to workflow_step_definitions');
  console.log('   - Added index for performance');
  console.log('   - currentPhase column kept for backward compatibility\n');
  
  console.log('🔍 To verify, run:');
  console.log('   DESCRIBE project_workflow_states;\n');
  
  console.log('🎯 Next steps:');
  console.log('   1. Restart backend server');
  console.log('   2. Test projectDeadlineMonitor with new schema');
  console.log('   3. Optionally migrate existing data\n');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\nTry running manually:');
  console.error('   cd backend');
  console.error('   npx sequelize-cli db:migrate\n');
  process.exit(1);
}
