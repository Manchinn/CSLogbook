/**
 * Script: Manually run late/overdue states seeder
 * 
 * This bypasses sequelize-cli and runs the seeder directly
 * Usage: node scripts/seedLateOverdueStates.js
 */

const { sequelize } = require('../config/database');
const seeder = require('../seeders/20251122000001-add-late-overdue-states');

async function runSeeder() {
  console.log('🚀 Starting late/overdue states seeder...\n');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Run the seeder
    await seeder.up(sequelize.getQueryInterface(), sequelize);
    
    console.log('\n✨ Seeder completed successfully!');
    console.log('📊 Run this query to verify:');
    console.log('   SELECT step_key, phase_variant FROM workflow_step_definitions WHERE phase_variant IN ("late", "overdue");\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeder:', error);
    process.exit(1);
  }
}

runSeeder();
