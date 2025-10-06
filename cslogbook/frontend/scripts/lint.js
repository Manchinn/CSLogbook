// กำหนดค่า environment สำหรับการรัน ESLint
process.env.BABEL_ENV = process.env.BABEL_ENV || 'development';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

process.on('unhandledRejection', err => {
  throw err;
});

// โหลดตัวแปรสภาพแวดล้อมให้สอดคล้องกับสคริปต์อื่น
require('../config/env');

const { ESLint } = require('eslint');
const chalk = require('react-dev-utils/chalk');

(async () => {
  try {
    const eslint = new ESLint({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    });

    const results = await eslint.lintFiles(['src']);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    if (resultText) {
      console.log(resultText);
    }

    const hasErrors = ESLint.getErrorResults(results).length > 0;
    const hasWarnings = results.some(result => result.warningCount > 0);

    if (hasErrors) {
      process.exit(1);
    }

    if (
      hasWarnings &&
      process.env.CI &&
      (typeof process.env.CI !== 'string' || process.env.CI.toLowerCase() !== 'false')
    ) {
      console.log(
        chalk.yellow(
          '\nTreating warnings as errors because process.env.CI = true.\n' +
            'Most CI servers set this automatically.\n'
        )
      );
      process.exit(1);
    }

    if (!hasErrors && !hasWarnings) {
      console.log(chalk.green('ESLint ตรวจสอบผ่านโดยไม่พบปัญหา\n'));
    }
  } catch (error) {
    console.log(chalk.red('ESLint ล้มเหลวเนื่องจากข้อผิดพลาดต่อไปนี้:\n'));
    console.error(error);
    process.exit(1);
  }
})();
