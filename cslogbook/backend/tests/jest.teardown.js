module.exports = async () => {
  try {
    const databaseModule = require('../config/database');
    const sequelize = databaseModule?.sequelize;
    const dialect = sequelize?.options?.dialect;

    if (process.env.LOG_ACTIVE_HANDLES === 'true') {
      const originalLog = global.__ORIGINAL_CONSOLE_LOG || console.log;
      const handles = process._getActiveHandles();
      const summary = handles.map((handle) => {
        const name = handle?.constructor?.name || typeof handle;
        if (name === 'Socket') {
          const details = [];
          if (typeof handle.remoteAddress === 'string') {
            details.push(handle.remoteAddress);
          }
          if (typeof handle.remotePort === 'number') {
            details.push(handle.remotePort);
          }
          return details.length ? `${name}(${details.join(':')})` : name;
        }
        return name;
      });
      originalLog('[TEST_LOG] active handles before teardown', summary);
    }

    if (sequelize && typeof sequelize.close === 'function' && dialect && dialect !== 'sqlite') {
      await sequelize.close();
      if (process.env.LOG_ACTIVE_HANDLES === 'true') {
        const originalLog = global.__ORIGINAL_CONSOLE_LOG || console.log;
        const handles = process._getActiveHandles();
        const summary = handles.map((handle) => handle?.constructor?.name || typeof handle);
        originalLog('[TEST_LOG] active handles after closing sequelize', summary);
      }
    }
  } catch (error) {
    const originalLog = global.__ORIGINAL_CONSOLE_LOG || console.log;
    originalLog('[TEST_LOG] global teardown skipped closing sequelize', error.message);
  }
};