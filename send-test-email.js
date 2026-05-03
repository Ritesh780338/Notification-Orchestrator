require('dotenv').config();
const emailAdapter = require('./src/adapters/email.adapter');

/**
 * Send test email to specific recipient
 */

async function sendTestEmail() {
  console.log('\n========================================');
  console.log('📧 Sending Test Email');
  console.log('========================================\n');

  const recipient = 'xfutkarshpandey@gmail.com';
  const subject = '🎉 Test Email from Notification Orchestrator';
  const body = `
Hello!

This is a test email from the Notification Orchestrator system.

✅ Email System Test Successful!

This email confirms that the notification system is working correctly and can send emails to external recipients.

System Information:
- Sender: ${process.env.SMTP_USER}
- Sent via: ${process.env.SMTP_HOST}
- Timestamp: ${new Date().toLocaleString()}

The Notification Orchestrator is a robust system designed to handle:
📧 Email notifications
📱 SMS notifications  
🔔 Push notifications
📲 In-app notifications

All channels are orchestrated with:
✓ User preferences management
✓ Template support
✓ Rate limiting
✓ Retry mechanisms
✓ Delivery tracking
✓ Quiet hours support

If you received this email, the system is functioning perfectly! 🚀

Best regards,
Notification Orchestrator Team
  `.trim();

  console.log(`Recipient: ${recipient}`);
  console.log(`Subject: ${subject}`);
  console.log(`From: ${process.env.SMTP_USER}\n`);

  try {
    console.log('Sending email...');
    const result = await emailAdapter.send(recipient, subject, body);

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Recipient: ${recipient}`);
      console.log(`   Status: Delivered\n`);
    } else {
      console.log('\n❌ Failed to send email!');
      console.log(`   Error: ${result.error}\n`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('========================================');
  console.log('✨ Test Complete!');
  console.log('========================================\n');
}

// Run the test
sendTestEmail()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
