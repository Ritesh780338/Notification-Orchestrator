require('dotenv').config();
const smsAdapter = require('./src/adapters/sms.adapter');
const logger = require('./src/config/logger');

/**
 * Test SMS Configuration with Fast2SMS
 * This script tests if the SMS API is properly configured
 */

async function testSMSConfiguration() {
  console.log('\n========================================');
  console.log('📱 SMS Configuration Test (Fast2SMS)');
  console.log('========================================\n');

  // Display configuration (without showing full API key)
  console.log('Configuration:');
  console.log(`  SMS Provider: ${process.env.SMS_PROVIDER}`);
  console.log(`  API Key: ${process.env.SMS_API_KEY ? process.env.SMS_API_KEY.substring(0, 10) + '...' + process.env.SMS_API_KEY.slice(-10) : 'NOT SET'}\n`);

  // Test 1: Verify SMS Configuration
  console.log('Test 1: Verifying SMS Configuration...');
  try {
    const isVerified = await smsAdapter.verify();
    if (isVerified) {
      console.log('✅ SMS Configuration verified successfully!\n');
    } else {
      console.log('❌ SMS Configuration verification failed!\n');
      return;
    }
  } catch (error) {
    console.error('❌ SMS Configuration verification error:', error.message);
    return;
  }

  // Test 2: Send Test SMS to your number
  console.log('Test 2: Sending test SMS...');
  console.log('Note: Fast2SMS works with Indian phone numbers (+91)\n');
  
  try {
    // You can change this to your phone number for testing
    const testPhoneNumber = '9876543210'; // Replace with actual test number
    const testMessage = `Hello from Notification Orchestrator! 

This is a test SMS to verify your Fast2SMS integration is working correctly.

✅ SMS System Active
🕐 Sent at: ${new Date().toLocaleString()}

Your notification system is ready! 🚀`;

    console.log(`Sending SMS to: +91${testPhoneNumber}`);
    console.log(`Message: ${testMessage.substring(0, 50)}...\n`);

    const result = await smsAdapter.send(testPhoneNumber, testMessage);

    if (result.success) {
      console.log('✅ Test SMS sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Phone Number: +91${testPhoneNumber}`);
      if (result.response) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
      console.log('\n   📱 Check your phone for the SMS!\n');
    } else {
      console.log('❌ Test SMS failed to send!');
      console.log(`   Error: ${result.error}\n`);
      
      // Provide helpful error messages
      if (result.error.includes('Invalid')) {
        console.log('💡 Tip: Make sure the phone number is a valid 10-digit Indian number');
      }
      if (result.error.includes('authorization') || result.error.includes('401')) {
        console.log('💡 Tip: Check if your Fast2SMS API key is correct');
      }
      if (result.error.includes('balance') || result.error.includes('credit')) {
        console.log('💡 Tip: Check your Fast2SMS account balance');
      }
    }
  } catch (error) {
    console.error('❌ Error sending test SMS:', error.message);
  }

  // Test 3: Test with different phone number formats
  console.log('\nTest 3: Testing phone number format handling...');
  try {
    const testNumbers = [
      '9876543210',      // 10 digits
      '+919876543210',   // With +91
      '919876543210'     // With 91
    ];

    console.log('Testing different phone number formats:');
    for (const number of testNumbers) {
      console.log(`  - Format: ${number} → Cleaned: ${number.replace(/^\+91/, '').replace(/\D/g, '')}`);
    }
    console.log('✅ Phone number format handling verified\n');
  } catch (error) {
    console.error('❌ Format test error:', error.message);
  }

  // Test 4: API Information
  console.log('Test 4: Fast2SMS API Information');
  console.log('  Base URL: https://www.fast2sms.com/dev/bulkV2');
  console.log('  Route: v3 (Promotional)');
  console.log('  Sender ID: TXTIND');
  console.log('  Language: English');
  console.log('  Dashboard: https://www.fast2sms.com/dashboard\n');

  console.log('========================================');
  console.log('✨ SMS Testing Complete!');
  console.log('========================================\n');

  console.log('📝 Important Notes:');
  console.log('  1. Fast2SMS requires Indian phone numbers (+91)');
  console.log('  2. Check your Fast2SMS dashboard for delivery status');
  console.log('  3. Ensure you have sufficient balance in your account');
  console.log('  4. Update the test phone number in this script for actual testing');
  console.log('  5. SMS delivery may take a few seconds\n');
}

// Run the test
testSMSConfiguration()
  .then(() => {
    console.log('All tests completed. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  });
