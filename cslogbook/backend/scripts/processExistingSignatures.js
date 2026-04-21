// Load environment variables first
require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const { Signatory } = require('../models');
const { removeWhiteBackground } = require('../utils/imageUtils');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function processAllSignatures() {
    try {
        const signatories = await Signatory.findAll();
        console.log(`Found ${signatories.length} signatories. Processing...`);

        for (const signatory of signatories) {
            if (signatory.signatureUrl) {
                const fullPath = path.join(__dirname, '..', signatory.signatureUrl);
                if (fs.existsSync(fullPath)) {
                    console.log(`Processing signature for: ${signatory.name} (${fullPath})`);
                    
                    const buffer = fs.readFileSync(fullPath);
                    try {
                        const processedBuffer = await removeWhiteBackground(buffer);
                        
                        // บันทึกกลับเป็น PNG
                        const newFilename = fullPath.replace(/\.[^/.]+$/, "") + ".png";
                        fs.writeFileSync(newFilename, processedBuffer);
                        
                        // อัปเดตใน DB ถ้าเปลี่ยนนามสกุล
                        const relativePath = path.relative(path.join(__dirname, '..'), newFilename).replace(/\\/g, '/');
                        if (relativePath !== signatory.signatureUrl) {
                            await signatory.update({ signatureUrl: relativePath });
                            // ลบไฟล์เก่าถ้าคนละไฟล์กัน
                            if (fullPath !== newFilename && fs.existsSync(fullPath)) {
                                fs.unlinkSync(fullPath);
                            }
                        }
                        console.log(`Successfully processed: ${signatory.name}`);
                    } catch (err) {
                        console.error(`Failed to process ${signatory.name}:`, err.message);
                    }
                } else {
                    console.warn(`File not found: ${fullPath}`);
                }
            }
        }
        console.log('All signatures processed.');
        process.exit(0);
    } catch (error) {
        console.error('Error processing signatures:', error);
        process.exit(1);
    }
}

processAllSignatures();
