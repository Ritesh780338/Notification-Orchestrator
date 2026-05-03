require('dotenv').config();
const emailAdapter = require('./src/adapters/email.adapter');
const logger = require('./src/config/logger');

/**
 * Test Email Configuration
 * This script tests if the email credentials are properly configured
 */

async function testEmailConfiguration() {
  console.log('\n========================================');
  console.log('📧 Email Configuration Test');
  console.log('========================================\n');

  // Display configuration (without showing password)
  console.log('Configuration:');
  console.log(`  SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`  SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`  SMTP User: ${process.env.SMTP_USER}`);
  console.log(`  SMTP Password: ${process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'NOT SET'}`);
  console.log(`  SMTP From: ${process.env.SMTP_FROM}\n`);

  // Test 1: Verify SMTP Connection
  console.log('Test 1: Verifying SMTP Connection...');
  try {
    const isVerified = await emailAdapter.verify();
    if (isVerified) {
      console.log('✅ SMTP Connection verified successfully!\n');
    } else {
      console.log('❌ SMTP Connection verification failed!\n');
      return;
    }
  } catch (error) {
    console.error('❌ SMTP Connection verification error:', error.message);
    return;
  }

  // Test 2: Send Test Email
  console.log('Test 2: Sending test email...');
  try {
    const testRecipient = process.env.SMTP_USER; // Send to yourself
    const testSubject = '🎉 Notification Orchestrator - Test Email';
    const testBody = `
Hello!

This is a test email from your Notification Orchestrator system.

✅ Your email configuration is working correctly!

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From Address: ${process.env.SMTP_FROM}

Test performed at: ${new Date().toLocaleString()}

If you received this email, your notification system is ready to send emails! 🚀

Best regards,
Notification Orchestrator Team
    `.trim();

    const result = await emailAdapter.send(testRecipient, testSubject, testBody);

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Recipient: ${testRecipient}`);
      console.log(`   Check your inbox at: ${testRecipient}\n`);
    } else {
      console.log('❌ Test email failed to send!');
      console.log(`   Error: ${result.error}\n`);
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
  }

  // Test 3: Send Multiple Test Emails
  console.log('Test 3: Sending multiple test emails (batch test)...');
  try {
    const testRecipient = process.env.SMTP_USER;
    const emailPromises = [];

    for (let i = 1; i <= 3; i++) {
      const subject = `Test Email #${i} - Batch Test`;
      const body = `This is test email number ${i} from your batch test.\n\nSent at: ${new Date().toLocaleString()}`;
      emailPromises.push(emailAdapter.send(testRecipient, subject, body));
    }

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Batch test completed: ${successCount}/3 emails sent successfully\n`);
  } catch (error) {
    console.error('❌ Batch test error:', error.message);
  }

  console.log('========================================');
  console.log('✨ Email Testing Complete!');
  console.log('========================================\n');
}

// Run the test
testEmailConfiguration()
  .then(() => {
    console.log('All tests completed. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  });
