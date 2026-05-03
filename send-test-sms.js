require('dotenv').config();
const smsAdapter = require('./src/adapters/sms.adapter');

/**
 * Send test SMS to specific phone number
 * Usage: node send-test-sms.js <phone_number>
 * Example: node send-test-sms.js 9876543210
 */

async function sendTestSMS() {
  console.log('\n========================================');
  console.log('📱 Sending Test SMS via Fast2SMS');
  console.log('========================================\n');

  // Get phone number from command line argument or use default
  const phoneNumber = process.argv[2] || '9876543210';
  
  const message = `🎉 Test SMS from Notification Orchestrator

Hello! This is a test message from your notification system.

✅ SMS Integration Working!

System Features:
📧 Email notifications
📱 SMS notifications
🔔 Push notifications
📲 In-app messages

Sent at: ${new Date().toLocaleString()}

Your notification system is live! 🚀`;

  console.log(`Phone Number: +91${phoneNumber}`);
  console.log(`Provider: Fast2SMS`);
  console.log(`Message Length: ${message.length} characters\n`);

  try {
    console.log('Sending SMS...');
    const result = await smsAdapter.send(phoneNumber, message);

    if (result.success) {
      console.log('\n✅ SMS sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Phone: +91${phoneNumber}`);
      console.log(`   Status: Delivered to Fast2SMS\n`);
      
      if (result.response) {
        console.log('   API Response:');
        console.log(`   ${JSON.stringify(result.response, null, 2)}\n`);
      }
      
      console.log('📱 Check your phone for the SMS!');
      console.log('📊 Check delivery status at: https://www.fast2sms.com/dashboard/delivery-reports\n');
    } else {
      console.log('\n❌ Failed to send SMS!');
      console.log(`   Error: ${result.error}\n`);
      
      // Helpful error messages
      if (result.error.includes('Invalid')) {
        console.log('💡 Make sure the phone number is a valid 10-digit Indian number');
        console.log('   Usage: node send-test-sms.js 9876543210\n');
      }
      if (result.error.includes('authorization') || result.error.includes('401')) {
        console.log('💡 Check if your Fast2SMS API key is correct in .env file\n');
      }
      if (result.error.includes('balance') || result.error.includes('credit')) {
        console.log('💡 Check your Fast2SMS account balance');
        console.log('   Dashboard: https://www.fast2sms.com/dashboard\n');
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('========================================');
  console.log('✨ Test Complete!');
  console.log('========================================\n');
}

// Run the test
sendTestSMS()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
