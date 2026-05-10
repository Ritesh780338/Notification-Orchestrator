#!/usr/bin/env node

/**
 * Direct SMS Sender
 * Usage: node send-sms-now.js <phone> <message>
 */

require('dotenv').config();
const smsAdapter = require('./src/adapters/sms.adapter');

async function sendSMS() {
  const phoneNumber = process.argv[2] || process.env.TEST_PHONE_NUMBER;
  const message = process.argv.slice(3).join(' ') || 'Test SMS from Notification Orchestrator';

  if (!phoneNumber) {
    console.error('❌ Phone number required!');
    console.log('Usage: node send-sms-now.js <phone> <message>');
    console.log('Example: node send-sms-now.js 9876543210 "Hello World"');
    process.exit(1);
  }

  console.log('\n📱 Sending SMS...');
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${message}`);
  console.log(`Provider: ${process.env.SMS_PROVIDER}\n`);

  const result = await smsAdapter.send(phoneNumber, message);

  if (result.success) {
    console.log('✅ SMS SENT SUCCESSFULLY!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Provider: ${result.provider}\n`);
  } else {
    console.error('❌ SMS FAILED!');
    console.error(`Error: ${result.error}\n`);
    
    if (result.error.includes('101')) {
      console.log('💡 API Key is invalid. Get your real API key from SMS Local dashboard.');
    }
  }
}

sendSMS().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
