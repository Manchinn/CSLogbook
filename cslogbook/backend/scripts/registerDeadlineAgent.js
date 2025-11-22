/**
 * Quick Registration Script for deadlineStatusUpdater
 * 
 * This script provides the exact code to add to agents/index.js
 * Copy and paste this into the file manually or use your editor
 */

console.log(`
===========================================
STEP 1: Add Import (after line 18)
===========================================

After this line:
  const internshipStatusMonitor = require('./internshipStatusMonitor');

Add:
  const deadlineStatusUpdater = require('./deadlineStatusUpdater');

===========================================
STEP 2: Add Agent Registration (after line ~117)
===========================================

After the internshipStatusMonitor block (around line 117), add:

      deadlineStatusUpdater: {
        start: () => {
          logger.info('Starting deadline status updater');
          deadlineStatusUpdater.start();
          return true;
        },
        stop: () => {
          logger.info('Stopping deadline status updater');
          deadlineStatusUpdater.stop();
          return true;
        },
        get isRunning() {
          return deadlineStatusUpdater.isRunning || false;
        }
      },

IMPORTANT: Add this BEFORE the comment line:
  // เพิ่ม agent อื่นๆ ที่นี่

===========================================
OR use this single-line regex find/replace:
===========================================

FIND:
const internshipStatusMonitor = require\\('./internshipStatusMonitor'\\);

REPLACE WITH:
const internshipStatusMonitor = require('./internshipStatusMonitor');
const deadlineStatusUpdater = require('./deadlineStatusUpdater');

THEN FIND:
      // เพิ่ม agent อื่นๆ ที่นี่

REPLACE WITH:
      deadlineStatusUpdater: {
        start: () => {
          logger.info('Starting deadline status updater');
          deadlineStatusUpdater.start();
          return true;
        },
        stop: () => {
          logger.info('Stopping deadline status updater');
          deadlineStatusUpdater.stop();
          return true;
        },
        get isRunning() {
          return deadlineStatusUpdater.isRunning || false;
        }
      },
      // เพิ่ม agent อื่นๆ ที่นี่

===========================================
`);
