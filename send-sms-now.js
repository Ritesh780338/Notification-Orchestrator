require('dotenv').config();
const smsAdapter = require('./src/adapters/sms.adapter');

/**
 * Quick SMS sender - Edit the phone number below and run
 */

async function sendSMS() {
  console.log('\n📱 Fast2SMS - Quick Test\n');

  // ⚠️ EDIT THIS: Replace with your actual 10-digit Indian phone number
  const YOUR_PHONE_NUMBER = '9876543210'; // <-- Change this!
  
  const message = `Hello from Notification Orchestrator!

✅ Your SMS system is working!

This is a test message sent at ${new Date().toLocaleString()}

System is ready to send notifications! 🚀`;

  console.log(`Sending to: +91${YOUR_PHONE_NUMBER}\n`);

  try {
    const result = await smsAdapter.send(YOUR_PHONE_NUMBER, message);

    if (result.success) {
      console.log('✅ SUCCESS! SMS sent!');
      console.log(`Message ID: ${result.messageId}`);
      console.log('\n📱 Check your phone!\n');
    } else {
      console.log('❌ FAILED!');
      console.log(`Error: ${result.error}\n`);
      
      console.log('Common issues:');
      console.log('1. Invalid phone number - must be 10 digits');
      console.log('2. Insufficient balance in Fast2SMS account');
      console.log('3. API key might be disabled/expired');
      console.log('\nCheck: https://www.fast2sms.com/dashboard\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

sendSMS().then(() => process.exit(0));
