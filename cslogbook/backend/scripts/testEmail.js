/**
 * สคริปต์ทดสอบการส่งอีเมล
 * ใช้สำหรับทดสอบว่า Email configuration ตั้งค่าถูกต้องหรือไม่
 * 
 * วิธีใช้: node scripts/testEmail.js
 */

const path = require('path');
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env.development')
});
const readline = require('readline');
const emailTransport = require('../utils/emailTransport');
const logger = require('../utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testEmail() {
  console.log('\n========================================');
  console.log('  🧪 ทดสอบการส่งอีเมล CSLogbook');
  console.log('========================================\n');

  console.log('Email Configuration:');
  console.log(`   Provider: ${process.env.EMAIL_PROVIDER || 'gmail'}`);
  console.log(`   Sender: ${process.env.EMAIL_SENDER || 'not set'}`);

  if ((process.env.EMAIL_PROVIDER || 'gmail') === 'gmail') {
    console.log(`   Gmail User: ${process.env.GMAIL_USER_EMAIL || 'not set'}`);
    console.log(`   Client ID: ${process.env.GMAIL_CLIENT_ID ? '***set***' : 'not set'}`);
    console.log(`   Client Secret: ${process.env.GMAIL_CLIENT_SECRET ? '***set***' : 'not set'}`);
    console.log(`   Refresh Token: ${process.env.GMAIL_REFRESH_TOKEN ? '***set***' : 'not set'}`);
  }
  
  console.log('\n');

  try {
    // ขอ email ปลายทาง
    const recipientEmail = await question('📧 ใส่อีเมลปลายทาง (สำหรับทดสอบ): ');
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.log('❌ อีเมลไม่ถูกต้อง กรุณาใส่อีเมลที่ถูกต้อง');
      rl.close();
      return;
    }

    console.log('\n⏳ กำลังเริ่มต้น email transport...');
    await emailTransport.init();
    console.log('✅ เริ่มต้น email transport สำเร็จ\n');

    console.log('📨 กำลังส่งอีเมลทดสอบ...');
    
    const testMessage = {
      to: recipientEmail,
      from: process.env.EMAIL_SENDER,
      subject: 'ทดสอบการส่งอีเมล - CSLogbook System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; 
                       margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1 style="margin: 0;">ทดสอบการส่งอีเมลสำเร็จ!</h1>
            </div>
            <div class="content">
              <h2>🎉 ระบบ Email ทำงานปกติ</h2>
              <p>นี่คืออีเมลทดสอบจากระบบ <strong>CS Logbook</strong></p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📊 ข้อมูลการทดสอบ</h3>
                <p><strong>Email Provider:</strong> ${process.env.EMAIL_PROVIDER || 'gmail'}</p>
                <p><strong>ผู้ส่ง:</strong> ${process.env.EMAIL_SENDER}</p>
                <p><strong>ผู้รับ:</strong> ${recipientEmail}</p>
                <p><strong>เวลาส่ง:</strong> ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>
              </div>

              <p>✅ หากคุณได้รับอีเมลนี้ แสดงว่าระบบการส่งอีเมลทำงานถูกต้องแล้ว</p>
              
              <p><strong>ระบบจะส่งอีเมลแจ้งเตือนในกรณีต่อไปนี้:</strong></p>
              <ul>
                <li>🔐 การเข้าสู่ระบบ</li>
                <li>📄 การส่งเอกสารเพื่ออนุมัติ</li>
                <li>✅ การอนุมัติ/ปฏิเสธเอกสาร</li>
                <li>📝 การส่งบันทึกการปฏิบัติงาน (Logbook)</li>
                <li>📅 การนัดหมาย/การประชุม</li>
                <li>⭐ การส่งคำขออนุมัติบันทึกการฝึกงาน</li>
                <li>📊 การส่งคำขอประเมินผลการฝึกงาน</li>
              </ul>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CS Logbook - KMUTNB Computer Science</p>
              <p style="font-size: 12px; color: #999;">อีเมลนี้ส่งโดยอัตโนมัติจากระบบ</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await emailTransport.send(testMessage);
    
    console.log('\n✅ ส่งอีเมลสำเร็จ!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Recipient: ${recipientEmail}`);
    
    console.log('\n========================================');
    console.log('  ✅ การทดสอบสำเร็จ!');
    console.log('========================================');
    console.log('\n📧 กรุณาตรวจสอบอีเมลที่: ' + recipientEmail);
    console.log('💡 ถ้าไม่เห็นอีเมล ลองตรวจสอบ Spam/Junk folder\n');

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:');
    console.error(`   ${error.message}`);
    console.error('\n🔍 วิธีแก้ไข:');
    
    if (error.message.includes('Missing required environment variable')) {
      console.error('   - ตรวจสอบว่าตั้งค่า GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER_EMAIL แล้ว');
    } else if (error.message.includes('invalid_grant') || error.message.includes('Token')) {
      console.error('   - Refresh token อาจหมดอายุ — ลองสร้างใหม่ที่ OAuth Playground');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      console.error('   - ตรวจสอบ Internet connection');
    } else {
      console.error('   - ตรวจสอบการตั้งค่าใน .env file');
      console.error('   - ตรวจสอบ logs ใน console');
    }
    
    logger.error('Email test failed', { error: error.message, stack: error.stack });
  } finally {
    rl.close();
  }
}

// Run the test
testEmail().catch(console.error);
