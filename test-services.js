/**
 * Test Script for SMS and Email Services
 * Tests Fast2SMS and Gmail SMTP configuration
 */

require('dotenv').config();
const emailAdapter = require('./src/adapters/email.adapter');
const smsAdapter = require('./src/adapters/sms.adapter');

async function testEmailService() {
  console.log('\n========================================');
  console.log('📧 TESTING EMAIL SERVICE');
  console.log('========================================\n');

  console.log('Configuration:');
  console.log('- SMTP Host:', process.env.SMTP_HOST);
  console.log('- SMTP Port:', process.env.SMTP_PORT);
  console.log('- SMTP User:', process.env.SMTP_USER);
  console.log('- SMTP From:', process.env.SMTP_FROM);
  console.log('- Password Length:', process.env.SMTP_PASSWORD?.length || 0, 'chars');
  console.log('- Password (masked):', process.env.SMTP_PASSWORD ? '****' + process.env.SMTP_PASSWORD.slice(-4) : 'NOT SET');

  try {
    console.log('\n🔍 Verifying email adapter...');
    const verified = await emailAdapter.verify();
    
    if (verified) {
      console.log('✅ Email adapter verified successfully!\n');
      
      console.log('📤 Sending test email...');
      const result = await emailAdapter.send(
        process.env.SMTP_USER, // Send to yourself
        'Test Email - NotifyHub',
        'This is a test email from NotifyHub Notification Orchestrator.\n\nIf you receive this, your email configuration is working correctly!\n\nTimestamp: ' + new Date().toISOString()
      );

      if (result.success) {
        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', result.messageId);
        console.log('   Recipient:', result.recipient);
      } else {
        console.log('❌ Email sending failed:', result.error);
      }
    } else {
      console.log('❌ Email adapter verification failed!');
      console.log('   Check your SMTP credentials in .env file');
    }
  } catch (error) {
    console.error('❌ Email test error:', error.message);
    console.error('   Full error:', error);
  }
}

async function testSMSService() {
  console.log('\n========================================');
  console.log('📱 TESTING SMS SERVICE');
  console.log('========================================\n');

  console.log('Configuration:');
  console.log('- Provider:', process.env.SMS_PROVIDER);
  console.log('- API Key Length:', process.env.SMS_API_KEY?.length || 0, 'chars');
  console.log('- API Key (masked):', process.env.SMS_API_KEY ? process.env.SMS_API_KEY.slice(0, 10) + '...' + process.env.SMS_API_KEY.slice(-10) : 'NOT SET');
  console.log('- Test Phone:', process.env.TEST_PHONE_NUMBER || 'NOT SET');

  try {
    console.log('\n🔍 Verifying SMS adapter...');
    const verified = await smsAdapter.verify();
    
    if (verified) {
      console.log('✅ SMS adapter verified successfully!\n');
      
      if (process.env.TEST_PHONE_NUMBER) {
        console.log('📤 Sending test SMS...');
        const result = await smsAdapter.send(
          process.env.TEST_PHONE_NUMBER,
          'Test SMS from NotifyHub: Your notification system is working! Time: ' + new Date().toLocaleTimeString()
        );

        if (result.success) {
          console.log('✅ SMS sent successfully!');
          console.log('   Message ID:', result.messageId);
          console.log('   Provider:', result.provider);
          console.log('   Phone:', result.phoneNumber);
        } else {
          console.log('❌ SMS sending failed:', result.error);
        }
      } else {
        console.log('⚠️  TEST_PHONE_NUMBER not set in .env - skipping SMS send test');
      }
    } else {
      console.log('❌ SMS adapter verification failed!');
      console.log('   Check your SMS API key in .env file');
    }
  } catch (error) {
    console.error('❌ SMS test error:', error.message);
    console.error('   Full error:', error);
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  NotifyHub Service Testing Suite      ║');
  console.log('╚════════════════════════════════════════╝');

  await testEmailService();
  await testSMSService();

  console.log('\n========================================');
  console.log('✅ ALL TESTS COMPLETED');
  console.log('========================================\n');
  
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
